import { AppShell } from "@/components/app-shell";
import { TenantForm } from "@/components/tenant-form";

export default function NewTenantPage() {
  return <AppShell active="tenants"><TenantForm /></AppShell>;
}
