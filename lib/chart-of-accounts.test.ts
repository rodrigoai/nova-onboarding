import { describe, expect, it } from "vitest";
import {
  findExistingChild,
  flattenNovaAccounts,
  mergeChartOfAccounts,
  normalizeAccountName,
  sortSuggestionsForPublishing,
  type ChartAccount,
} from "./chart-of-accounts";

const existing: ChartAccount[] = [
  { id: 20, accountName: "Receitas", nestedId: null, reason: 2, source: "nova" },
  { id: 21, accountName: "Serviços", nestedId: 20, reason: 2, source: "nova" },
  { id: 30, accountName: "Custos", nestedId: null, reason: 3, source: "nova" },
];

describe("chart of accounts rules", () => {
  it("normalizes accents, casing and repeated whitespace", () => {
    expect(normalizeAccountName("  Serviços   TÉCNICOS ")).toBe("servicos tecnicos");
  });

  it("flattens nested Nova accounts and keeps only the three allowed groups", () => {
    const result = flattenNovaAccounts([
      {
        id: 1,
        name: "Ativo",
        reason: 0,
        children: [{ id: 2, name: "Banco", reason: 0, children: [] }],
      },
      {
        id: 20,
        name: "Receitas",
        reason: 2,
        children: [{ id: 21, name: "Serviços", reason: 2, children: [] }],
      },
      { id: 30, name: "Custos", reason: 3, children: [] },
      { id: 40, name: "Despesas", reason: 4, children: [] },
    ]);

    expect(result.map((account) => account.id)).toEqual([20, 21, 30, 40]);
    expect(result.find((account) => account.id === 21)?.nestedId).toBe(20);
  });

  it("derives the group through suggested parents and ignores duplicate siblings", () => {
    const result = mergeChartOfAccounts(existing, [
      { id: -1, accountName: "Consultoria", nestedId: 20 },
      { id: -2, accountName: "Projetos especiais", nestedId: -1 },
      { id: -3, accountName: "  SERVIÇOS ", nestedId: 20 },
    ]);

    expect(result.filter((account) => account.source === "suggested")).toEqual([
      { id: -1, accountName: "Consultoria", nestedId: 20, reason: 2, source: "suggested" },
      { id: -2, accountName: "Projetos especiais", nestedId: -1, reason: 2, source: "suggested" },
    ]);
  });

  it("reattaches children when their suggested parent already exists", () => {
    const result = mergeChartOfAccounts(existing, [
      { id: -1, accountName: "SERVIÇOS", nestedId: 20 },
      { id: -2, accountName: "Assinaturas", nestedId: -1 },
    ]);

    expect(result.find((account) => account.id === -2)).toMatchObject({
      nestedId: 21,
      reason: 2,
      source: "suggested",
    });
  });

  it("rejects orphaned and cyclic suggestions", () => {
    expect(() => mergeChartOfAccounts(existing, [
      { id: -1, accountName: "Órfã", nestedId: 999 },
    ])).toThrow("não existe");
    expect(() => mergeChartOfAccounts(existing, [
      { id: -1, accountName: "Conta A", nestedId: -2 },
      { id: -2, accountName: "Conta B", nestedId: -1 },
    ])).toThrow("ciclo");
  });

  it("orders every suggested parent before its children", () => {
    const ordered = sortSuggestionsForPublishing([
      { id: -3, accountName: "Nível 3", nestedId: -2 },
      { id: -1, accountName: "Nível 1", nestedId: 20 },
      { id: -2, accountName: "Nível 2", nestedId: -1 },
    ]);
    expect(ordered.map((account) => account.id)).toEqual([-1, -2, -3]);
  });

  it("reconciles an existing child with normalized names", () => {
    expect(findExistingChild(existing, 20, "servíços")?.id).toBe(21);
    expect(findExistingChild(existing, 30, "servíços")).toBeUndefined();
  });
});
