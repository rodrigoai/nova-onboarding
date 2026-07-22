import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TenantNotFound() {
  return <main className="nova-grid grid min-h-screen place-items-center px-6 text-center"><div><p className="text-sm font-bold text-[#6b3ba6]">404</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Tenant não encontrado</h1><p className="mt-3 text-sm text-[#6e6e7c]">O cadastro pode ter sido removido ou o endereço está incorreto.</p><Link href="/tenants" className="btn-secondary mt-6"><ArrowLeft size={15} /> Voltar para tenants</Link></div></main>;
}
