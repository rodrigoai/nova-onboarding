import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TenantForm } from "@/components/tenant-form";
import { getTenant } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function EditTenantPage({ params }: { params: Promise<{ id: string }> }) {
  const tenant = await getTenant((await params).id);
  if (!tenant) notFound();
  return <AppShell active="tenants"><TenantForm initial={{ id: tenant.id, tenantName: tenant.tenantName }} /></AppShell>;
}
