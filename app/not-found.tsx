import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
  return <main className="grid min-h-screen place-items-center px-6 text-center"><div><p className="text-sm font-bold text-[#2c7548]">404</p><h1 className="mt-2 text-3xl font-bold tracking-[-.04em]">Empresa não encontrada</h1><p className="mt-3 text-sm text-[#737973]">O cadastro pode ter sido removido ou o endereço está incorreto.</p><Link href="/" className="btn-secondary mt-6"><ArrowLeft size={15} /> Voltar para empresas</Link></div></main>;
}
