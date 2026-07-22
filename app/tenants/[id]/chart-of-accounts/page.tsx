import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ChartOfAccountsWorkspace } from "@/components/chart-of-accounts-workspace";
import { getTenant } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function ChartOfAccountsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = await getTenant(id);
  if (!tenant) notFound();

  return (
    <AppShell active="tenants">
      <main className="page-enter px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Link href={`/tenants/${id}`} className="mb-5 inline-flex items-center gap-1.5 text-xs font-bold text-[#6e6e7c] hover:text-[#52248e]"><ArrowLeft size={14} /> {tenant.tenantName}</Link>
          <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Configuração financeira</p>
              <h1 className="text-3xl font-bold tracking-[-0.045em] sm:text-[38px]">Plano de contas</h1>
              <p className="mt-2 text-sm text-[#6e6e7c]">{tenant.tenantName}.nova.money</p>
            </div>
            <Link href={`/tenants/${id}/edit`} className="btn-secondary"><Pencil size={15} /> Editar descrição</Link>
          </header>
          <ChartOfAccountsWorkspace tenantId={tenant.id} tenantName={tenant.tenantName} hasDescription={Boolean(tenant.description?.trim())} />
        </div>
      </main>
    </AppShell>
  );
}
