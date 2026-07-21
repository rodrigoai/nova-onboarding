import Link from "next/link";
import { ArrowRight, Building2, Plus, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { listCompanies } from "@/lib/companies";
import { formatCnpj, formatDate } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; type?: string }>;

async function getCompanies(query: string, type: string) {
  if (!isSupabaseConfigured()) return { companies: [], configured: false };
  try {
    const companies = await listCompanies(query, type);
    return { companies, configured: true };
  } catch {
    return { companies: [], configured: false };
  }
}

export default async function Home({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const type = params.type ?? "";
  const { companies, configured } = await getCompanies(query, type);

  return (
    <AppShell>
      <div className="page-enter px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col justify-between gap-5 border-b border-[#e9e9ed] pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Operação fiscal</p>
              <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-[38px]">Empresas</h1>
              <p className="mt-2 text-sm text-[#6e6e7c]">Dados necessários para emissão de notas fiscais.</p>
            </div>
            <Link href="/companies/new" className="btn-primary"><Plus size={16} /> Nova empresa</Link>
          </header>

          {!configured && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#f0dda8] bg-[#fff9e9] p-4 text-sm leading-6 text-[#66511d]">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-[#ecbc4c]" />
              <div><strong>Supabase aguardando configuração.</strong> Confira as variáveis públicas e aplique a migration antes de salvar empresas.</div>
            </div>
          )}

          <form className="mt-7 flex flex-col gap-3 sm:flex-row" action="/">
            <label className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-[#85818e]" size={17} />
              <input className="field pl-10" name="q" defaultValue={query} placeholder="Buscar por razão social ou CNPJ" />
            </label>
            <label className="relative sm:w-48">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-3 text-[#85818e]" size={17} />
              <select className="field appearance-none pl-10" name="type" defaultValue={type}>
                <option value="">Todos os tipos</option>
                <option value="SERVICE">Serviços</option>
                <option value="PRODUCT">Produtos</option>
              </select>
            </label>
            <button className="btn-secondary" type="submit">Filtrar</button>
          </form>

          <section className="mt-7" aria-label="Lista de empresas">
            <div className="hidden grid-cols-[1.5fr_1fr_.8fr_.65fr_auto] gap-5 border-b border-[#e9e9ed] px-3 pb-3 text-[11px] font-bold uppercase tracking-[.1em] text-[#8a8791] md:grid">
              <span>Empresa</span><span>CNPJ</span><span>Tipo</span><span>Atualização</span><span className="w-6" />
            </div>
            {companies.length ? (
              <div className="divide-y divide-[#e9e9ed]">
                {companies.map((company) => (
                  <Link key={company.id} href={`/companies/${company.id}`} className="group grid gap-3 px-3 py-5 transition-colors hover:bg-[#fcfbfe] md:grid-cols-[1.5fr_1fr_.8fr_.65fr_auto] md:items-center md:gap-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0e9f7] text-sm font-bold text-[#52248e]">{company.legalName.slice(0, 1).toUpperCase()}</span>
                      <span className="truncate font-bold tracking-[-0.01em]">{company.legalName}</span>
                    </div>
                    <span className="text-sm text-[#64616d]">{formatCnpj(company.cnpj)}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {company.noteTypes.map((noteType) => <span key={noteType} className="rounded-full bg-[#f0e9f7] px-2 py-1 text-[11px] font-bold text-[#63339d]">{noteType === "SERVICE" ? "Serviço" : "Produto"}</span>)}
                    </div>
                    <span className="text-xs text-[#7c7984]">{formatDate(company.updatedAt)}</span>
                    <ArrowRight className="hidden text-[#9b96a2] transition-transform group-hover:translate-x-1 group-hover:text-[#52248e] md:block" size={17} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center border-b border-[#e9e9ed] text-center">
                <div className="max-w-sm py-12">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f0e9f7] text-[#63339d]"><Building2 size={21} /></span>
                  <h2 className="mt-4 text-lg font-bold">{query || type ? "Nenhuma empresa encontrada" : "Cadastre a primeira empresa"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">{query || type ? "Tente remover ou alterar os filtros." : "O formulário organiza os dados fiscais em quatro etapas simples."}</p>
                  {!query && !type && <Link href="/companies/new" className="btn-secondary mt-5"><Plus size={15} /> Nova empresa</Link>}
                </div>
              </div>
            )}
          </section>
          <p className="mt-4 text-xs text-[#85818e]">{companies.length} {companies.length === 1 ? "empresa" : "empresas"}</p>
        </div>
      </div>
    </AppShell>
  );
}
