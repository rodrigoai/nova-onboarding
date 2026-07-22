import { z } from "zod";

export const ALLOWED_ACCOUNT_REASONS = [2, 3, 4] as const;
export type AccountReason = (typeof ALLOWED_ACCOUNT_REASONS)[number];

export const ACCOUNT_GROUP_LABELS: Record<AccountReason, string> = {
  2: "Receita",
  3: "Custo",
  4: "Despesa",
};

export const novaFinancialAccountSchema: z.ZodType<NovaFinancialAccount> = z.lazy(() =>
  z.object({
    id: z.number().int(),
    name: z.string(),
    reason: z.number().int(),
    financial_account_id: z.number().int().nullable().optional(),
    financial_account: z.string().nullable().optional(),
    income: z.boolean().optional(),
    outcome: z.boolean().optional(),
    active: z.boolean().optional(),
    children: z.array(novaFinancialAccountSchema).nullable().optional(),
  }),
);

export const novaFinancialAccountsSchema = z.array(novaFinancialAccountSchema);

export const generatedSuggestionSchema = z.object({
  id: z.number().int().negative(),
  accountName: z.string().trim().min(2).max(120),
  nestedId: z.number().int(),
});

export const generatedSuggestionsSchema = z.object({
  accounts: z.array(generatedSuggestionSchema).max(120),
});

export type NovaFinancialAccount = {
  id: number;
  name: string;
  reason: number;
  financial_account_id?: number | null;
  financial_account?: string | null;
  income?: boolean;
  outcome?: boolean;
  active?: boolean;
  children?: NovaFinancialAccount[] | null;
};

export type AccountSuggestion = z.infer<typeof generatedSuggestionSchema>;

export type ChartAccount = {
  id: number;
  accountName: string;
  nestedId: number | null;
  reason: AccountReason;
  source: "nova" | "suggested";
};

export type ChartAccountNode = ChartAccount & { children: ChartAccountNode[] };

export function isAllowedReason(reason: number): reason is AccountReason {
  return ALLOWED_ACCOUNT_REASONS.includes(reason as AccountReason);
}

export function normalizeAccountName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("pt-BR");
}

export function flattenNovaAccounts(input: NovaFinancialAccount[]): ChartAccount[] {
  const flattened = new Map<number, ChartAccount>();

  function visit(account: NovaFinancialAccount, traversalParentId: number | null) {
    const parentId = account.financial_account_id ?? traversalParentId;
    if (isAllowedReason(account.reason)) {
      flattened.set(account.id, {
        id: account.id,
        accountName: account.name.trim(),
        nestedId: parentId,
        reason: account.reason,
        source: "nova",
      });
    }
    for (const child of account.children ?? []) visit(child, account.id);
  }

  for (const account of input) visit(account, null);
  return [...flattened.values()];
}

export function mergeChartOfAccounts(
  existingAccounts: ChartAccount[],
  rawSuggestions: AccountSuggestion[],
) {
  const suggestions = rawSuggestions.map((suggestion) => generatedSuggestionSchema.parse(suggestion));
  const existingById = new Map(existingAccounts.map((account) => [account.id, account]));
  const suggestionsById = new Map<number, AccountSuggestion>();

  for (const suggestion of suggestions) {
    if (existingById.has(suggestion.id) || suggestionsById.has(suggestion.id)) {
      throw new Error(`A sugestão usa um ID duplicado: ${suggestion.id}.`);
    }
    suggestionsById.set(suggestion.id, suggestion);
  }

  const generated: ChartAccount[] = [];
  const generatedById = new Map<number, ChartAccount>();
  const resolvedSuggestionIds = new Map<number, number>();
  const siblingAccounts = new Map(
    existingAccounts.map((account) => [
      `${account.nestedId ?? "root"}:${normalizeAccountName(account.accountName)}`,
      account,
    ]),
  );

  for (const suggestion of sortSuggestionsForPublishing(suggestions)) {
    if (suggestion.nestedId === suggestion.id) {
      throw new Error(`A conta “${suggestion.accountName}” não pode ser pai dela mesma.`);
    }
    const parentId = suggestion.nestedId < 0
      ? resolvedSuggestionIds.get(suggestion.nestedId)
      : suggestion.nestedId;
    if (parentId === undefined) {
      throw new Error(`A conta pai ${suggestion.nestedId} não existe no plano atual.`);
    }
    const parent = existingById.get(parentId) ?? generatedById.get(parentId);
    if (!parent) throw new Error(`A conta pai ${parentId} não existe no plano atual.`);
    const siblingKey = `${parentId}:${normalizeAccountName(suggestion.accountName)}`;
    const duplicate = siblingAccounts.get(siblingKey);
    if (duplicate) {
      resolvedSuggestionIds.set(suggestion.id, duplicate.id);
      continue;
    }
    const account: ChartAccount = {
      id: suggestion.id,
      accountName: suggestion.accountName.trim(),
      nestedId: parentId,
      reason: parent.reason,
      source: "suggested",
    };
    generated.push(account);
    generatedById.set(account.id, account);
    siblingAccounts.set(siblingKey, account);
    resolvedSuggestionIds.set(suggestion.id, account.id);
  }

  return [...existingAccounts, ...generated];
}

export function sortSuggestionsForPublishing(suggestions: AccountSuggestion[]) {
  const byId = new Map(suggestions.map((suggestion) => [suggestion.id, suggestion]));
  const visited = new Set<number>();
  const visiting = new Set<number>();
  const ordered: AccountSuggestion[] = [];

  function visit(suggestion: AccountSuggestion) {
    if (visited.has(suggestion.id)) return;
    if (visiting.has(suggestion.id)) throw new Error("As sugestões contêm um ciclo de contas.");
    visiting.add(suggestion.id);
    const parent = byId.get(suggestion.nestedId);
    if (parent) visit(parent);
    visiting.delete(suggestion.id);
    visited.add(suggestion.id);
    ordered.push(suggestion);
  }

  for (const suggestion of suggestions) visit(suggestion);
  return ordered;
}

export function findExistingChild(
  accounts: ChartAccount[],
  parentId: number,
  accountName: string,
) {
  const normalizedName = normalizeAccountName(accountName);
  return accounts.find(
    (account) =>
      account.nestedId === parentId && normalizeAccountName(account.accountName) === normalizedName,
  );
}

export function buildAccountTree(accounts: ChartAccount[]): ChartAccountNode[] {
  const nodes = new Map<number, ChartAccountNode>(
    accounts.map((account) => [account.id, { ...account, children: [] }]),
  );
  const roots: ChartAccountNode[] = [];

  for (const node of nodes.values()) {
    const parent = node.nestedId === null ? undefined : nodes.get(node.nestedId);
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  const sortNodes = (items: ChartAccountNode[]) => {
    items.sort((left, right) => {
      if (left.source !== right.source) return left.source === "nova" ? -1 : 1;
      return left.accountName.localeCompare(right.accountName, "pt-BR");
    });
    for (const item of items) sortNodes(item.children);
  };
  sortNodes(roots);
  return roots;
}
