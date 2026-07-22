import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpenText, Building2, Database, KeyRound, ListTree, Pencil } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CopyButton } from "@/components/copy-button";
import { DeleteTenantButton } from "@/components/delete-tenant-button";
import { listCompaniesByTenant } from "@/lib/companies";
import { decryptSecret } from "@/lib/crypto";
import { formatCnpj, formatDate } from "@/lib/format";
import { getTenant } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tenant, companies] = await Promise.all([getTenant(id), listCompaniesByTenant(id)]);
  if (!tenant) notFound();
  const novaMoneyKey = decryptSecret(tenant.novaMoneyKey);

  return (
    <AppShell active="tenants">
      <div className="page-enter px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-5xl">
          <Link href="/tenants" className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#6e6e7c] hover:text-[#52248e]"><ArrowLeft size={14} /> Tenants</Link>
          <header className="flex flex-col justify-between gap-5 border-b border-[#e9e9ed] pb-7 sm:flex-row sm:items-end">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Conta principal</p>
              <h1 className="truncate text-3xl font-bold tracking-[-0.045em] sm:text-[38px]">{tenant.tenantName}</h1>
              <p className="mt-2 text-sm text-[#6e6e7c]">{tenant.tenantName}.nova.money · Atualizado em {formatDate(tenant.updatedAt)}</p>
            </div>
            <Link href={`/tenants/${id}/edit`} className="btn-primary"><Pencil size={15} /> Editar</Link>
          </header>

          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <section>
              <div className="mb-2 flex items-center gap-2"><Database size={17} className="text-[#52248e]" /><h2 className="font-bold">Identificação</h2></div>
              <dl className="rounded-2xl border border-[#e9e9ed] bg-white px-5 shadow-[0_10px_30px_rgba(82,36,142,.04)]">
                <div className="border-b border-[#e9e9ed] py-4"><dt className="text-xs font-bold text-[#777481]">Tenant name</dt><dd className="mt-1 text-sm font-semibold">{tenant.tenantName}</dd></div>
                <div className="border-b border-[#e9e9ed] py-4"><dt className="text-xs font-bold text-[#777481]">Endereço base</dt><dd className="mt-1 flex items-center justify-between gap-3 text-sm font-semibold"><span>{tenant.tenantName}.nova.money</span><CopyButton value={`${tenant.tenantName}.nova.money`} label="" /></dd></div>
                <div className="py-4"><dt className="text-xs font-bold text-[#777481]">Endereço de pagamentos</dt><dd className="mt-1 flex items-center justify-between gap-3 text-sm font-semibold"><span>{tenant.tenantName}.pay.nova.money</span><CopyButton value={`${tenant.tenantName}.pay.nova.money`} label="" /></dd></div>
              </dl>
            </section>
            <section>
              <div className="mb-2 flex items-center gap-2"><KeyRound size={17} className="text-[#52248e]" /><h2 className="font-bold">Acesso à API</h2></div>
              <div className="rounded-2xl border border-[#e9e9ed] bg-white p-5 shadow-[0_10px_30px_rgba(82,36,142,.04)]">
                <p className="text-xs font-bold text-[#777481]">Nova Money Key</p>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <span className={`text-sm font-semibold ${novaMoneyKey ? "" : "text-[#9d4a42]"}`}>{novaMoneyKey ? "••••••••••••••••" : "Configuração necessária"}</span>
                  {novaMoneyKey && <CopyButton value={novaMoneyKey} label="Copiar chave" />}
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#7c7984]">A chave permanece criptografada no banco e só é recuperada para uso autorizado.</p>
            </section>
          </div>

          <section className="mt-9">
            <div className="mb-2 flex items-center gap-2"><BookOpenText size={17} className="text-[#52248e]" /><h2 className="font-bold">Sobre o negócio</h2></div>
            <div className="min-h-28 whitespace-pre-wrap rounded-2xl border border-[#e9e9ed] bg-white p-5 text-sm leading-7 text-[#45434e] shadow-[0_10px_30px_rgba(82,36,142,.04)]">
              {tenant.description || "Nenhuma descrição registrada."}
            </div>
          </section>

          <section className="mt-9 flex flex-col justify-between gap-4 border-y border-[#e7e3eb] py-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f0e9f7] text-[#63339d]"><ListTree size={19} /></span>
              <div><h2 className="font-bold">Plano de contas</h2><p className="mt-1 text-xs leading-5 text-[#7c7984]">Mescle a estrutura atual com sugestões baseadas neste negócio.</p></div>
            </div>
            <Link href={`/tenants/${id}/chart-of-accounts`} className="btn-secondary">Configurar plano <ArrowRight size={15} /></Link>
          </section>

          <section className="mt-9">
            <div className="mb-3 flex items-end justify-between gap-4">
              <div><div className="flex items-center gap-2"><Building2 size={17} className="text-[#52248e]" /><h2 className="font-bold">Empresas vinculadas</h2></div><p className="mt-1 text-xs text-[#7c7984]">{companies.length} {companies.length === 1 ? "empresa utiliza" : "empresas utilizam"} esta base.</p></div>
              <Link href="/companies/new" className="btn-secondary"><Building2 size={15} /> Nova empresa</Link>
            </div>
            <div className="divide-y divide-[#e9e9ed] rounded-2xl border border-[#e9e9ed] bg-white px-4">
              {companies.length ? companies.map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`} className="group flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0"><p className="truncate text-sm font-bold">{company.legalName}</p><p className="mt-1 text-xs text-[#7c7984]">{formatCnpj(company.cnpj)}</p></div>
                  <ArrowRight className="shrink-0 text-[#9b96a2] transition-transform group-hover:translate-x-1 group-hover:text-[#52248e]" size={17} />
                </Link>
              )) : <p className="py-8 text-center text-sm text-[#777481]">Nenhuma empresa vinculada.</p>}
            </div>
          </section>

          <div className="mt-10 flex justify-end border-t border-[#e9e9ed] pt-6"><DeleteTenantButton id={id} companyCount={companies.length} /></div>
        </div>
      </div>
    </AppShell>
  );
}
