"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteTenant } from "@/app/actions";

export function DeleteTenantButton({ id, companyCount }: { id: string; companyCount: number }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteTenant.bind(null, id), {});

  if (companyCount > 0) {
    return <p className="text-xs text-[#7c7984]">Este tenant não pode ser excluído enquanto possuir empresas vinculadas.</p>;
  }

  return (
    <div>
      {confirming ? (
        <form action={action} className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-[#7b302b]">Excluir definitivamente?</span>
          <button className="btn-danger" type="submit" disabled={pending}>{pending ? "Excluindo..." : "Sim, excluir"}</button>
          <button className="btn-ghost" type="button" onClick={() => setConfirming(false)}>Cancelar</button>
        </form>
      ) : (
        <button className="btn-danger" type="button" onClick={() => setConfirming(true)}><Trash2 size={15} /> Excluir</button>
      )}
      {state.error && <p role="alert" className="mt-2 text-sm font-semibold text-[#963b33]">{state.error}</p>}
    </div>
  );
}
