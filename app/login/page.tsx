import { LoginForm } from "./login-form";
import { BrandLogo } from "@/components/brand-logo";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#52248e] lg:grid-cols-[1.1fr_.9fr]">
      <section className="nova-grid-dark hidden flex-col justify-between p-12 text-white lg:flex">
        <BrandLogo light />
        <div className="max-w-lg"><p className="mb-4 text-xs font-bold uppercase tracking-[.16em] text-[#ecbc4c]">Operações fiscais</p><h1 className="text-5xl font-bold leading-[1.08] tracking-[-.055em]">Dados certos.<br />Notas sem atrito.</h1><p className="mt-5 max-w-md text-base leading-7 text-white/65">Acesso seguro ao cadastro fiscal das empresas que operam com a nova.money.</p></div>
        <p className="text-xs text-white/35">Ambiente interno · acesso restrito</p>
      </section>
      <section className="nova-grid grid place-items-center bg-[#f8f7fc] px-6 py-12">
        <div className="w-full max-w-sm rounded-[24px] border border-[#e6e1eb] bg-white p-7 shadow-[0_24px_60px_rgba(82,36,142,.15)] sm:p-9">
          <div className="mb-8 lg:hidden"><BrandLogo /></div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Acesso restrito</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">Entrar</h2>
          <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">Use seu usuário cadastrado no Supabase.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
