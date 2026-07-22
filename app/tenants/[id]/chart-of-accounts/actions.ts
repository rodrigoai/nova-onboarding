"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  findExistingChild,
  generatedSuggestionSchema,
  mergeChartOfAccounts,
  sortSuggestionsForPublishing,
  type AccountSuggestion,
  type ChartAccount,
} from "@/lib/chart-of-accounts";
import { decryptSecret } from "@/lib/crypto";
import {
  createNovaFinancialAccount,
  getNovaFinancialAccounts,
  NovaMoneyError,
} from "@/lib/nova-money";
import { generateAccountSuggestions } from "@/lib/openai-chart-of-accounts";
import { createClient } from "@/lib/supabase/server";
import { getTenant } from "@/lib/tenants";

const tenantIdSchema = z.string().uuid();
const suggestionsSchema = z.array(generatedSuggestionSchema).max(120);

export type GeneratedChartResult =
  | {
      ok: true;
      accounts: ChartAccount[];
      suggestions: AccountSuggestion[];
      generatedAt: string;
      model: string;
    }
  | { ok: false; error: string };

export type PublishAccountResult = {
  suggestionId: number;
  accountName: string;
  status: "created" | "existing" | "failed";
  novaId?: number;
  message?: string;
};

export type PublishChartResult =
  | { ok: true; accounts: ChartAccount[]; results: PublishAccountResult[] }
  | { ok: false; error: string };

async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) throw new Error("Sua sessão expirou. Entre novamente para continuar.");
}

async function tenantIntegration(tenantId: string) {
  await requireAuthenticatedUser();
  const id = tenantIdSchema.parse(tenantId);
  const tenant = await getTenant(id);
  if (!tenant) throw new Error("Tenant não encontrado ou sem acesso.");
  const persistentToken = decryptSecret(tenant.novaMoneyKey);
  if (!persistentToken) throw new Error("Configure uma Nova Money Key válida neste tenant.");
  return { tenant, persistentToken };
}

function actionError(error: unknown) {
  if (error instanceof NovaMoneyError) return error.message;
  if (error instanceof z.ZodError) return "Os dados do plano de contas são inválidos.";
  if (error instanceof Error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return "A integração demorou mais que o esperado. Tente novamente.";
    }
    if (
      error.message.includes("OPENAI_API_KEY") ||
      error.message.includes("sessão") ||
      error.message.includes("Tenant") ||
      error.message.includes("Nova Money Key") ||
      error.message.includes("descrição") ||
      error.message.includes("sugest") ||
      error.message.includes("conta")
    ) {
      return error.message;
    }
  }
  return "Não foi possível concluir a operação. Tente novamente.";
}

export async function generateChartOfAccounts(tenantId: string): Promise<GeneratedChartResult> {
  try {
    const { tenant, persistentToken } = await tenantIntegration(tenantId);
    const description = tenant.description?.trim();
    if (!description) {
      throw new Error("Adicione uma descrição do negócio antes de gerar sugestões.");
    }
    const existingAccounts = await getNovaFinancialAccounts(tenant.tenantName, persistentToken);
    const { suggestions, model } = await generateAccountSuggestions({
      tenantDescription: description,
      existingAccounts,
    });
    const accounts = mergeChartOfAccounts(existingAccounts, suggestions);
    const acceptedSuggestions = accounts
      .filter((account) => account.source === "suggested" && account.nestedId !== null)
      .map((account) => ({
        id: account.id,
        accountName: account.accountName,
        nestedId: account.nestedId!,
      }));
    return {
      ok: true,
      accounts,
      suggestions: acceptedSuggestions,
      generatedAt: new Date().toISOString(),
      model,
    };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}

export async function publishChartOfAccounts(
  tenantId: string,
  rawSuggestions: AccountSuggestion[],
): Promise<PublishChartResult> {
  try {
    const suggestions = suggestionsSchema.parse(rawSuggestions);
    const { tenant, persistentToken } = await tenantIntegration(tenantId);
    let liveAccounts = await getNovaFinancialAccounts(tenant.tenantName, persistentToken);
    const merged = mergeChartOfAccounts(liveAccounts, suggestions);
    const generatedById = new Map(
      merged.filter((account) => account.source === "suggested").map((account) => [account.id, account]),
    );
    const acceptedSuggestions = [...generatedById.values()]
      .filter((account) => account.nestedId !== null)
      .map((account) => ({
        id: account.id,
        accountName: account.accountName,
        nestedId: account.nestedId!,
      }));
    const ordered = sortSuggestionsForPublishing(acceptedSuggestions);
    const resolvedIds = new Map<number, number>();
    const results: PublishAccountResult[] = [];

    for (const suggestion of ordered) {
      const parentId = suggestion.nestedId < 0
        ? resolvedIds.get(suggestion.nestedId)
        : suggestion.nestedId;
      if (!parentId) {
        results.push({
          suggestionId: suggestion.id,
          accountName: suggestion.accountName,
          status: "failed",
          message: "A conta pai não pôde ser criada.",
        });
        continue;
      }

      const existing = findExistingChild(liveAccounts, parentId, suggestion.accountName);
      if (existing) {
        resolvedIds.set(suggestion.id, existing.id);
        results.push({
          suggestionId: suggestion.id,
          accountName: suggestion.accountName,
          status: "existing",
          novaId: existing.id,
        });
        continue;
      }

      try {
        const novaId = await createNovaFinancialAccount(tenant.tenantName, persistentToken, {
          financialAccountId: parentId,
          name: suggestion.accountName,
        });
        const generated = generatedById.get(suggestion.id)!;
        liveAccounts = [
          ...liveAccounts,
          { ...generated, id: novaId, nestedId: parentId, source: "nova" },
        ];
        resolvedIds.set(suggestion.id, novaId);
        results.push({
          suggestionId: suggestion.id,
          accountName: suggestion.accountName,
          status: "created",
          novaId,
        });
      } catch (error) {
        try {
          liveAccounts = await getNovaFinancialAccounts(tenant.tenantName, persistentToken);
          const reconciled = findExistingChild(liveAccounts, parentId, suggestion.accountName);
          if (reconciled) {
            resolvedIds.set(suggestion.id, reconciled.id);
            results.push({
              suggestionId: suggestion.id,
              accountName: suggestion.accountName,
              status: "created",
              novaId: reconciled.id,
              message: "Criação confirmada após reconciliação.",
            });
            continue;
          }
        } catch {
          // Keep the original creation failure when reconciliation is unavailable.
        }
        results.push({
          suggestionId: suggestion.id,
          accountName: suggestion.accountName,
          status: "failed",
          message: actionError(error),
        });
      }
    }

    try {
      liveAccounts = await getNovaFinancialAccounts(tenant.tenantName, persistentToken);
    } catch {
      // The locally reconciled result still reflects every confirmed creation.
    }
    revalidatePath(`/tenants/${tenantId}/chart-of-accounts`);
    return { ok: true, accounts: liveAccounts, results };
  } catch (error) {
    return { ok: false, error: actionError(error) };
  }
}
