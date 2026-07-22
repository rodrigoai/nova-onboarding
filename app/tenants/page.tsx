import Link from "next/link";
import { ArrowRight, Database, Plus, Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { formatDate } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { listTenants } from "@/lib/tenants";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string }>;

async function getTenants(query: string) {
  if (!isSupabaseConfigured()) return { tenants: [], configured: false };
  try {
    return { tenants: await listTenants(query), configured: true };
  } catch {
    return { tenants: [], configured: false };
  }
}

export default async function TenantsPage({ searchParams }: { searchParams: SearchParams }) {
  const query = (await searchParams).q?.trim() ?? "";
  const { tenants, configured } = await getTenants(query);

  return (
    <AppShell active="tenants">
      <div className="page-enter px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <header className="flex flex-col justify-between gap-5 border-b border-[#e9e9ed] pb-7 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Conta principal</p>
              <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-[38px]">Tenants</h1>
              <p className="mt-2 text-sm text-[#6e6e7c]">Bases Nova Money e suas empresas vinculadas.</p>
            </div>
            <Link href="/tenants/new" className="btn-primary"><Plus size={16} /> Novo tenant</Link>
          </header>

          {!configured && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#f0dda8] bg-[#fff9e9] p-4 text-sm leading-6 text-[#66511d]">
              <span className="mt-1 size-2 shrink-0 rounded-full bg-[#ecbc4c]" />
              <div><strong>Migration pendente.</strong> Configure o Supabase e aplique a migration de tenants para acessar estes cadastros.</div>
            </div>
          )}

          <form className="mt-7 flex gap-3" action="/tenants">
            <label className="relative flex-1">
              <Search className="absolute left-3.5 top-3 text-[#85818e]" size={17} />
              <input className="field pl-10" name="q" defaultValue={query} placeholder="Buscar por tenant" />
            </label>
            <button className="btn-secondary" type="submit">Buscar</button>
          </form>

          <section className="mt-7" aria-label="Lista de tenants">
            <div className="hidden grid-cols-[1.5fr_.7fr_.7fr_auto] gap-5 border-b border-[#e9e9ed] px-3 pb-3 text-[11px] font-bold uppercase tracking-[.1em] text-[#8a8791] md:grid">
              <span>Tenant</span><span>Empresas</span><span>Atualização</span><span className="w-6" />
            </div>
            {tenants.length ? (
              <div className="divide-y divide-[#e9e9ed]">
                {tenants.map((tenant) => (
                  <Link key={tenant.id} href={`/tenants/${tenant.id}`} className="group grid gap-3 px-3 py-5 transition-colors hover:bg-[#fcfbfe] md:grid-cols-[1.5fr_.7fr_.7fr_auto] md:items-center md:gap-5">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#f0e9f7] text-[#52248e]"><Database size={17} /></span>
                      <div className="min-w-0"><p className="truncate font-bold">{tenant.tenantName}</p><p className="truncate text-xs text-[#7c7984]">{tenant.tenantName}.nova.money</p></div>
                    </div>
                    <span className="text-sm text-[#64616d]">{tenant.companyCount} {tenant.companyCount === 1 ? "empresa" : "empresas"}</span>
                    <span className="text-xs text-[#7c7984]">{formatDate(tenant.updatedAt)}</span>
                    <ArrowRight className="hidden text-[#9b96a2] transition-transform group-hover:translate-x-1 group-hover:text-[#52248e] md:block" size={17} />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center border-b border-[#e9e9ed] text-center">
                <div className="max-w-sm py-12">
                  <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f0e9f7] text-[#63339d]"><Database size={21} /></span>
                  <h2 className="mt-4 text-lg font-bold">{query ? "Nenhum tenant encontrado" : "Cadastre o primeiro tenant"}</h2>
                  <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">{query ? "Tente alterar o termo de busca." : "Toda empresa precisa estar conectada a uma conta principal."}</p>
                  {!query && <Link href="/tenants/new" className="btn-secondary mt-5"><Plus size={15} /> Novo tenant</Link>}
                </div>
              </div>
            )}
          </section>
          <p className="mt-4 text-xs text-[#85818e]">{tenants.length} {tenants.length === 1 ? "tenant" : "tenants"}</p>
        </div>
      </div>
    </AppShell>
  );
}
