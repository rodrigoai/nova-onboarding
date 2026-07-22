"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { ArrowLeft, Check, Eye, EyeOff } from "lucide-react";
import { createTenant, updateTenant } from "@/app/actions";

export type TenantFormValues = { id?: string; tenantName?: string; description?: string };

export function TenantForm({ initial = {} }: { initial?: TenantFormValues }) {
  const [showKey, setShowKey] = useState(false);
  const action = useMemo(
    () => initial.id ? updateTenant.bind(null, initial.id) : createTenant,
    [initial.id],
  );
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="page-enter">
      <div className="border-b border-[#e9e9ed] bg-white px-5 py-5 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <Link href={initial.id ? `/tenants/${initial.id}` : "/tenants"} className="mb-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#6e6e7c] hover:text-[#52248e]">
            <ArrowLeft size={14} /> Voltar
          </Link>
          <h1 className="text-2xl font-bold tracking-[-0.035em] sm:text-[28px]">
            {initial.id ? "Editar tenant" : "Novo tenant"}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8 lg:px-12 lg:py-10">
        <div className="rounded-[22px] border border-[#e9e9ed] bg-white p-5 shadow-[0_16px_45px_rgba(82,36,142,.07)] sm:p-8">
          <p className="mb-1 text-xs font-bold uppercase tracking-[.14em] text-[#6b3ba6]">Conta principal</p>
          <h2 className="text-xl font-bold tracking-[-0.025em]">Acesso à base Nova Money</h2>
          <p className="mt-2 text-sm leading-6 text-[#6e6e7c]">O nome identifica o subdomínio usado pelas empresas vinculadas.</p>

          <div className="mt-7 space-y-6">
            <label className="block">
              <span className="label">Tenant name <span className="text-[#af3d34]">*</span></span>
              <div className="flex rounded-xl border border-[#e2e0e8] bg-white focus-within:border-[#52248e] focus-within:shadow-[0_0_0_3px_rgba(82,36,142,.11)]">
                <input className="min-w-0 flex-1 rounded-l-xl px-3 py-3 outline-none" name="tenantName" defaultValue={initial.tenantName} placeholder="acme" required maxLength={63} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" />
                <span className="flex items-center rounded-r-xl border-l border-[#e2e0e8] bg-[#f8f7fc] px-3 text-sm text-[#777481]">.nova.money</span>
              </div>
              <span className="hint block">Use letras minúsculas, números e hífens, sem espaços.</span>
            </label>

            <label className="block">
              <span className="label">Descrição do tenant</span>
              <textarea
                className="field min-h-40 resize-y"
                name="description"
                defaultValue={initial.description}
                placeholder="Descreva o negócio, como ele funciona, seus produtos, serviços e público..."
                maxLength={10000}
              />
              <span className="hint block">Contexto geral sobre o negócio para uso em funcionalidades futuras.</span>
            </label>

            <label className="block">
              <span className="label">Nova Money Key <span className="text-[#af3d34]">*</span></span>
              <div className="relative">
                <input
                  className="field pr-12"
                  name="novaMoneyKey"
                  type={showKey ? "text" : "password"}
                  placeholder={initial.id ? "Deixe vazio para manter a chave atual" : "Chave de acesso à API"}
                  required={!initial.id}
                  autoComplete="new-password"
                />
                <button type="button" aria-label={showKey ? "Ocultar chave" : "Exibir chave"} className="absolute right-3 top-3 text-[#777481]" onClick={() => setShowKey((value) => !value)}>
                  {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <span className="hint block">A chave é criptografada antes de ser armazenada.</span>
            </label>
          </div>

          {state.error && <div role="alert" className="mt-6 rounded-lg bg-[#fff1ef] px-4 py-3 text-sm font-semibold text-[#963b33]">{state.error}</div>}
        </div>

        <div className="mt-6 flex justify-end">
          <button className="btn-primary" type="submit" disabled={pending}>
            {pending ? "Salvando..." : initial.id ? "Salvar alterações" : "Cadastrar tenant"} <Check size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}
