import Link from "next/link";
import { Building2, Database, LifeBuoy, LogOut } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { BrandLogo } from "@/components/brand-logo";

export function AppShell({
  children,
  active = "companies",
}: {
  children: React.ReactNode;
  active?: "companies" | "tenants";
}) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="bg-[#52248e] px-5 py-5 text-white lg:fixed lg:inset-y-0 lg:w-[232px]">
        <Link href="/" className="inline-flex py-1">
          <BrandLogo light />
        </Link>
        <nav className="mt-8 flex gap-2 lg:block">
          <Link href="/" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active === "companies" ? "bg-white/14 shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]" : "text-white/65 hover:bg-white/8 hover:text-white"}`}>
            <Building2 size={17} /> Empresas
          </Link>
          <Link href="/tenants" className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold ${active === "tenants" ? "bg-white/14 shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]" : "text-white/65 hover:bg-white/8 hover:text-white"}`}>
            <Database size={17} /> Tenants
          </Link>
        </nav>
        <div className="mt-6 hidden border-t border-white/10 pt-5 text-xs leading-5 text-white/45 lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:block">
          <span className="mb-1 flex items-center gap-2 text-white/65"><LifeBuoy size={14} /> Operações fiscais</span>
          Dados para emissão de notas
          <form action={signOut} className="mt-3">
            <button className="flex items-center gap-2 text-xs font-semibold text-white/55 transition hover:text-white" type="submit"><LogOut size={14} /> Sair</button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 lg:col-start-2">{children}</main>
    </div>
  );
}
