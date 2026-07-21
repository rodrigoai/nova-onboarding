import Link from "next/link";
import { Building2, LifeBuoy, Settings } from "lucide-react";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="bg-[#151b17] px-5 py-5 text-white lg:fixed lg:inset-y-0 lg:w-[232px]">
        <Link href="/" className="flex items-center gap-2.5 text-[19px] font-bold tracking-[-0.03em]">
          <span className="grid size-8 place-items-center rounded-lg bg-[#39d47c] text-[#102519]">n</span>
          nova.money
        </Link>
        <nav className="mt-8 flex gap-2 lg:block">
          <Link href="/" className="flex items-center gap-3 rounded-lg bg-white/10 px-3 py-2.5 text-sm font-semibold">
            <Building2 size={17} /> Empresas
          </Link>
          <span className="hidden items-center gap-3 px-3 py-2.5 text-sm text-white/45 lg:flex">
            <Settings size={17} /> Configurações
          </span>
        </nav>
        <div className="mt-6 hidden border-t border-white/10 pt-5 text-xs leading-5 text-white/45 lg:absolute lg:bottom-5 lg:left-5 lg:right-5 lg:block">
          <span className="mb-1 flex items-center gap-2 text-white/65"><LifeBuoy size={14} /> Operações fiscais</span>
          Dados para emissão de notas
        </div>
      </aside>
      <main className="min-w-0 lg:col-start-2">{children}</main>
    </div>
  );
}
