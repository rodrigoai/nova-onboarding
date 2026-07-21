import Link from "next/link";
import { ArrowRight, Building2, Plus, Search, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { formatCnpj, formatDate } from "@/lib/format";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; type?: string }>;

async function getCompanies(query: string, type: string) {
  if (!process.env.DATABASE_URL) return { companies: [], configured: false };
  try {
    const companies = await getPrisma().company.findMany({
      where: {
        AND: [
          query ? { OR: [{ legalName: { contains: query, mode: "insensitive" } }, { cnpj: { contains: query.replace(/\D/g, "") } }] } : {},
          type === "SERVICE" || type === "PRODUCT" ? { noteTypes: { has: type } } : {},
        ],
      },
      orderBy: { updatedAt: "desc" },
    });
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
          <header className="flex flex-col justify-between gap-5 border-b border-[#dde1db] pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#26804c]">Operação fiscal</p>
              <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-[38px]">Empresas</h1>
              <p className="mt-2 text-sm text-[#737973]">Dados necessários para emissão de notas fiscais.</p>
            </div>
            <Link href="/companies/new" className="btn-primary"><Plus size={16} /> Nova empresa</Link>
          </header>

          {!configured && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#d8e7db] bg-[#f0f8f2] p-4 text-sm leading-6 text-[#31543c]">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-[#31bd6b]" />
              <div><strong>Banco aguardando configuração.</strong> Adicione <code className="rounded bg-white/70 px-1.5 py-0.5">DATABASE_URL</code> e execute a migration para começar a salvar empresas.</div>
            </div>
          )}

          <form className="mt-7 flex flex-col gap-3 sm:flex-row" action="/">
            <label className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-[#838983]" size={17} />
              <input className="field pl-10" name="q" defaultValue={query} placeholder="Buscar por razão social ou CNPJ" />
            </label>
            <label className="relative sm:w-48">
              <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-3 text-[#838983]" size={17} />
              <select className="field appearance-none pl-10" name="type" defaultValue={type}>
                <option value="">Todos os tipos</option>
                <option value="SERVICE">Serviços</option>
                <option value="PRODUCT">Produtos</option>
              </select>
            </label>
            <button className="btn-secondary" type="submit">Filtrar</button>
          </form>

          <section className="mt-7" aria-label="Lista de empresas">
            <div className="hidden grid-cols-[1.5fr_1fr_.8fr_.65fr_auto] gap-5 border-b border-[#dfe2dd] px-3 pb-3 text-[11px] font-bold uppercase tracking-[.1em] text-[#888e87] md:grid">
              <span>Empresa</span><span>CNPJ</span><span>Tipo</span><span>Atualização</span><span className="w-6" />
            </div>
            {companies.length ? (
              <div className="divide-y divide-[#e2e5e0]">
                {companies.map((company) => (
                  <Link key={company.id} href={`/companies/${company.id}`} className="group grid gap-3 px-3 py-5 transition-colors hover:bg-white md:grid-cols-[1.5fr_1fr_.8fr_.65fr_auto] md:items-center md:gap-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e5f5ea] text-sm font-bold text-[#256642]">{company.legalName.slice(0, 1).toUpperCase()}</span>
                      <span className="truncate font-bold tracking-[-0.01em]">{company.legalName}</span>
                    </div>
                    <span className="text-sm text-[#606660]">{formatCnpj(company.cnpj)}</span>
                    <div className="flex flex-wrap gap-1.5">
                      {company.noteTypes.map((noteType) => <span key={noteType} className="rounded-full bg-[#ecefeb] px-2 py-1 text-[11px] font-bold text-[#535a54]">{noteType === "SERVICE" ? "Serviço" : "Produto"}</span>)}
                    </div>
                    <span className="text-xs text-[#7a8079]">{formatDate(company.updatedAt)}</span>
                    <ArrowRight className="hidden text-[#969c95] transition-transform group-hover:translate-x-1 md:block" size={17} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center border-b border-[#dfe2dd] text-center">
                <div className="max-w-sm py-12">
                  <span className="mx-auto grid size-12 place-items-center rounded-xl bg-[#e6eee8] text-[#3c6a4d]"><Building2 size={21} /></span>
                  <h2 className="mt-4 text-lg font-bold">{query || type ? "Nenhuma empresa encontrada" : "Cadastre a primeira empresa"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#737973]">{query || type ? "Tente remover ou alterar os filtros." : "O formulário organiza os dados fiscais em quatro etapas simples."}</p>
                  {!query && !type && <Link href="/companies/new" className="btn-secondary mt-5"><Plus size={15} /> Nova empresa</Link>}
                </div>
              </div>
            )}
          </section>
          <p className="mt-4 text-xs text-[#858b84]">{companies.length} {companies.length === 1 ? "empresa" : "empresas"}</p>
        </div>
      </div>
    </AppShell>
  );
}
