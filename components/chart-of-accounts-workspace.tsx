"use client";

import { useMemo, useState, useTransition } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ListTree,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import {
  ACCOUNT_GROUP_LABELS,
  ALLOWED_ACCOUNT_REASONS,
  buildAccountTree,
  type AccountReason,
  type AccountSuggestion,
  type ChartAccount,
  type ChartAccountNode,
} from "@/lib/chart-of-accounts";
import {
  generateChartOfAccounts,
  publishChartOfAccounts,
  type PublishAccountResult,
} from "@/app/tenants/[id]/chart-of-accounts/actions";

type GeneratedChart = {
  accounts: ChartAccount[];
  suggestions: AccountSuggestion[];
  generatedAt: string;
  model: string;
};

function AccountRow({ node, depth = 0 }: { node: ChartAccountNode; depth?: number }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <li className="step-enter">
      <div
        className={`group flex min-h-12 items-center gap-2 border-b border-[#efedf2] py-2.5 pr-3 transition-colors last:border-b-0 ${node.source === "suggested" ? "bg-[#faf7fe] hover:bg-[#f6f0fc]" : "hover:bg-[#fcfbfd]"}`}
        style={{ paddingLeft: `${12 + depth * 24}px` }}
      >
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          disabled={!hasChildren}
          aria-label={expanded ? "Recolher subcontas" : "Expandir subcontas"}
          className="grid size-7 shrink-0 place-items-center rounded-lg text-[#777481] transition-colors hover:bg-white hover:text-[#52248e] disabled:opacity-30"
        >
          {hasChildren && (expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />)}
        </button>
        <span className={`size-2 shrink-0 rounded-full ${node.source === "suggested" ? "bg-[#7c43bd] shadow-[0_0_0_4px_rgba(124,67,189,.1)]" : "bg-[#c9c5cf]"}`} />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-[#33313b]">{node.accountName}</span>
        {node.source === "suggested" && (
          <span className="shrink-0 rounded-full bg-[#eee4f8] px-2 py-1 text-[10px] font-extrabold uppercase tracking-[.09em] text-[#63339d]">Sugestão IA</span>
        )}
        <span className="hidden shrink-0 font-mono text-[11px] text-[#9995a0] sm:inline">ID {node.id}</span>
      </div>
      {hasChildren && expanded && (
        <ul className="relative before:absolute before:bottom-2 before:left-[26px] before:top-0 before:w-px before:bg-[#e6e1ec]">
          {node.children.map((child) => <AccountRow key={child.id} node={child} depth={depth + 1} />)}
        </ul>
      )}
    </li>
  );
}

function AccountGroup({ reason, accounts }: { reason: AccountReason; accounts: ChartAccount[] }) {
  const nodes = useMemo(
    () => buildAccountTree(accounts.filter((account) => account.reason === reason)),
    [accounts, reason],
  );
  const suggestedCount = accounts.filter(
    (account) => account.reason === reason && account.source === "suggested",
  ).length;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#e5e2e9] bg-white shadow-[0_12px_35px_rgba(48,32,66,.045)]">
      <header className="flex items-center justify-between gap-4 border-b border-[#e9e6ed] bg-[#fbfafc] px-4 py-3.5 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-[#f0e9f7] text-[#63339d]"><CircleDollarSign size={18} /></span>
          <div>
            <h2 className="text-sm font-extrabold">{ACCOUNT_GROUP_LABELS[reason]}</h2>
            <p className="mt-0.5 text-[11px] text-[#7c7984]">{accounts.filter((account) => account.reason === reason).length} contas nesta estrutura</p>
          </div>
        </div>
        {suggestedCount > 0 && <span className="text-xs font-bold text-[#6b3ba6]">+{suggestedCount} novas</span>}
      </header>
      {nodes.length ? (
        <ul>{nodes.map((node) => <AccountRow key={node.id} node={node} />)}</ul>
      ) : (
        <p className="px-5 py-8 text-center text-sm text-[#777481]">Nenhuma conta encontrada neste grupo.</p>
      )}
    </section>
  );
}

function PublishSummary({ results }: { results: PublishAccountResult[] }) {
  const created = results.filter((result) => result.status === "created").length;
  const existing = results.filter((result) => result.status === "existing").length;
  const failures = results.filter((result) => result.status === "failed");

  return (
    <div className={`rounded-2xl border px-4 py-4 sm:px-5 ${failures.length ? "border-[#efd5d1] bg-[#fff9f8]" : "border-[#cde5d6] bg-[#f7fcf9]"}`}>
      <div className="flex items-start gap-3">
        {failures.length ? <AlertCircle className="mt-0.5 shrink-0 text-[#ae453a]" size={19} /> : <CheckCircle2 className="mt-0.5 shrink-0 text-[#287b4c]" size={19} />}
        <div>
          <p className="text-sm font-bold">Envio concluído</p>
          <p className="mt-1 text-xs leading-5 text-[#66636e]">{created} criadas · {existing} já existiam · {failures.length} falharam</p>
          {failures.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-[#8d3e36]">
              {failures.map((failure) => <li key={failure.suggestionId}>{failure.accountName}: {failure.message}</li>)}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export function ChartOfAccountsWorkspace({
  tenantId,
  tenantName,
  hasDescription,
}: {
  tenantId: string;
  tenantName: string;
  hasDescription: boolean;
}) {
  const [chart, setChart] = useState<GeneratedChart | null>(null);
  const [publishResults, setPublishResults] = useState<PublishAccountResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [operation, setOperation] = useState<"generate" | "publish" | null>(null);
  const [pending, startTransition] = useTransition();

  const generate = () => {
    setError(null);
    setPublishResults(null);
    setOperation("generate");
    startTransition(async () => {
      const result = await generateChartOfAccounts(tenantId);
      if (result.ok) {
        setChart(result);
      } else {
        setError(result.error);
      }
      setOperation(null);
    });
  };

  const publish = () => {
    if (!chart?.suggestions.length) return;
    setError(null);
    setOperation("publish");
    startTransition(async () => {
      const result = await publishChartOfAccounts(tenantId, chart.suggestions);
      if (result.ok) {
        setPublishResults(result.results);
        setChart((current) => current ? { ...current, accounts: result.accounts, suggestions: [] } : current);
      } else {
        setError(result.error);
      }
      setOperation(null);
    });
  };

  const suggestedCount = chart?.accounts.filter((account) => account.source === "suggested").length ?? 0;
  const existingCount = chart?.accounts.length ? chart.accounts.length - suggestedCount : 0;

  return (
    <div className="mt-8">
      <section className="flex flex-col gap-5 border-b border-[#e6e3e9] pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-[#6b3ba6]"><Sparkles size={16} /><p className="text-xs font-extrabold uppercase tracking-[.13em]">Sugestão inteligente</p></div>
          <h2 className="mt-2 text-2xl font-bold tracking-[-.035em]">Complete a estrutura antes de operar</h2>
          <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">A descrição de {tenantName} será combinada ao plano atual. Nenhuma conta é enviada sem sua confirmação.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {chart && (
            <button type="button" className="btn-secondary" onClick={generate} disabled={pending || !hasDescription}>
              <RefreshCw size={15} className={pending && operation === "generate" ? "animate-spin" : ""} /> Recarregar e mesclar
            </button>
          )}
          {!chart && (
            <button type="button" className="btn-primary" onClick={generate} disabled={pending || !hasDescription}>
              <Sparkles size={15} /> {pending && operation === "generate" ? "Gerando plano..." : "Gerar sugestões"}
            </button>
          )}
          {chart && suggestedCount > 0 && (
            <button type="button" className="btn-primary" onClick={publish} disabled={pending}>
              <Send size={15} /> {pending && operation === "publish" ? "Enviando..." : `Enviar ${suggestedCount} para a Nova`}
            </button>
          )}
        </div>
      </section>

      {!hasDescription && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-[#eedbb1] bg-[#fffaf0] px-4 py-4 text-sm text-[#72551c]">
          <AlertCircle className="mt-0.5 shrink-0" size={18} />
          <p>Adicione uma descrição do negócio ao tenant para orientar as sugestões.</p>
        </div>
      )}
      {error && (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-2xl border border-[#efd5d1] bg-[#fff8f7] px-4 py-4 text-sm text-[#923c34]">
          <AlertCircle className="mt-0.5 shrink-0" size={18} /><p>{error}</p>
        </div>
      )}
      {publishResults && <div className="mt-5"><PublishSummary results={publishResults} /></div>}

      {!chart && (
        <section className="mt-10 grid min-h-72 place-items-center rounded-3xl border border-dashed border-[#dcd6e3] bg-white/55 px-6 text-center">
          <div className="max-w-md">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#f0e9f7] text-[#63339d]"><ListTree size={25} /></span>
            <h2 className="mt-5 text-lg font-bold">O plano atual será preservado</h2>
            <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">Primeiro buscamos as contas existentes. A IA propõe apenas complementos nos grupos Receita, Custo e Despesa.</p>
          </div>
        </section>
      )}

      {chart && (
        <>
          <div className="mt-6 flex flex-col gap-3 border-b border-[#e6e3e9] pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#6e6e7c]">
              <span><strong className="text-[#292832]">{existingCount}</strong> existentes</span>
              <span><strong className="text-[#6b3ba6]">{suggestedCount}</strong> sugeridas</span>
              <span>Modelo {chart.model}</span>
            </div>
            <time className="text-[11px] text-[#85818e]" dateTime={chart.generatedAt}>Mesclado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(chart.generatedAt))}</time>
          </div>
          {suggestedCount === 0 && !publishResults && (
            <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#d5e7db] bg-[#f8fcf9] px-4 py-4 text-sm text-[#2f6946]">
              <CheckCircle2 size={18} className="shrink-0" /> O plano atual já cobre as necessidades identificadas.
            </div>
          )}
          <div className="mt-6 grid gap-5">
            {ALLOWED_ACCOUNT_REASONS.map((reason) => <AccountGroup key={reason} reason={reason} accounts={chart.accounts} />)}
          </div>
        </>
      )}
    </div>
  );
}
