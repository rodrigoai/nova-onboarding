import { AppShell } from "@/components/app-shell";
import { CompanyForm } from "@/components/company-form";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { listTenants } from "@/lib/tenants";

export const dynamic = "force-dynamic";

export default async function NewCompanyPage() {
  const tenants = isSupabaseConfigured() ? await listTenants().catch(() => []) : [];
  return <AppShell><CompanyForm tenants={tenants} /></AppShell>;
}
