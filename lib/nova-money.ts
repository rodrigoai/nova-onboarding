import "server-only";

import { z } from "zod";
import {
  flattenNovaAccounts,
  novaFinancialAccountsSchema,
  type ChartAccount,
} from "@/lib/chart-of-accounts";

const createdAccountSchema = z.object({ id: z.number().int() });

export class NovaMoneyError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "NovaMoneyError";
  }
}

function financialAccountsUrl(tenantName: string) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tenantName)) {
    throw new NovaMoneyError("O nome do tenant não é válido para a API da Nova Money.");
  }
  return `https://${tenantName}.nova.money/api/financial_accounts`;
}

async function errorMessage(response: Response) {
  try {
    const body = (await response.json()) as { error?: unknown; errors?: unknown };
    if (typeof body.error === "string") return body.error;
    if (Array.isArray(body.errors)) return body.errors.filter((item) => typeof item === "string").join(" ");
  } catch {
    // The status-specific message below is safer than returning an HTML response.
  }
  if (response.status === 401) return "A Nova Money Key não é válida.";
  if (response.status === 403) return "A chave não tem permissão para alterar o plano de contas.";
  return "A Nova Money não conseguiu processar a solicitação.";
}

async function novaFetch(
  tenantName: string,
  persistentToken: string,
  init?: RequestInit,
) {
  if (!persistentToken) throw new NovaMoneyError("A Nova Money Key não está configurada.");
  const response = await fetch(financialAccountsUrl(tenantName), {
    ...init,
    cache: "no-store",
    headers: {
      Accept: "application/json",
      PERSISTENT_TOKEN: persistentToken,
      ...init?.headers,
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new NovaMoneyError(await errorMessage(response), response.status);
  return response;
}

export async function getNovaFinancialAccounts(
  tenantName: string,
  persistentToken: string,
): Promise<ChartAccount[]> {
  const response = await novaFetch(tenantName, persistentToken);
  const payload = novaFinancialAccountsSchema.parse(await response.json());
  return flattenNovaAccounts(payload);
}

export async function createNovaFinancialAccount(
  tenantName: string,
  persistentToken: string,
  input: { financialAccountId: number; name: string },
) {
  const response = await novaFetch(tenantName, persistentToken, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      financial_account_id: input.financialAccountId,
      name: input.name,
    }),
  });
  return createdAccountSchema.parse(await response.json()).id;
}
