import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen bg-[#151b17] lg:grid-cols-[1.1fr_.9fr]">
      <section className="hidden flex-col justify-between p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5 text-xl font-bold tracking-[-0.03em]"><span className="grid size-9 place-items-center rounded-lg bg-[#39d47c] text-[#102519]">n</span>nova.money</div>
        <div className="max-w-lg"><p className="mb-4 text-xs font-bold uppercase tracking-[.16em] text-[#4de08d]">Operações fiscais</p><h1 className="text-5xl font-bold leading-[1.08] tracking-[-.055em]">Dados certos.<br />Notas sem atrito.</h1><p className="mt-5 max-w-md text-base leading-7 text-white/55">Acesso seguro ao cadastro fiscal das empresas que operam com a nova.money.</p></div>
        <p className="text-xs text-white/35">Ambiente interno · acesso restrito</p>
      </section>
      <section className="grid place-items-center bg-[#f6f7f4] px-6 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-[#e0e3de] bg-white p-7 shadow-[0_20px_50px_rgba(13,29,19,.1)] sm:p-9">
          <div className="mb-8 flex items-center gap-2.5 text-lg font-bold lg:hidden"><span className="grid size-8 place-items-center rounded-lg bg-[#39d47c] text-[#102519]">n</span>nova.money</div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[#26804c]">Acesso restrito</p>
          <h2 className="mt-2 text-3xl font-bold tracking-[-.045em]">Entrar</h2>
          <p className="mt-2 text-sm leading-6 text-[#737973]">Use seu usuário cadastrado no Supabase.</p>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
