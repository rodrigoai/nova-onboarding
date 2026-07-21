"use client";

import { useActionState } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { signIn } from "@/app/auth/actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="mt-8 space-y-5">
      <label className="block">
        <span className="label">E-mail</span>
        <input className="field" name="email" type="email" autoComplete="email" placeholder="voce@nova.money" required />
      </label>
      <label className="block">
        <span className="label">Senha</span>
        <input className="field" name="password" type="password" autoComplete="current-password" placeholder="Sua senha" required />
      </label>
      {state.error && <p role="alert" className="rounded-lg bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#963b33]">{state.error}</p>}
      <button className="btn-primary w-full" disabled={pending}>
        <LockKeyhole size={16} /> {pending ? "Entrando..." : "Entrar"} <ArrowRight size={16} />
      </button>
    </form>
  );
}
