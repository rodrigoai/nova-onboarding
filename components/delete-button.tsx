"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { deleteCompany } from "@/app/actions";

export function DeleteButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);
  return confirming ? (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-[#7b302b]">Excluir definitivamente?</span>
      <button className="btn-danger" type="button" onClick={() => deleteCompany(id)}>Sim, excluir</button>
      <button className="btn-ghost" type="button" onClick={() => setConfirming(false)}>Cancelar</button>
    </div>
  ) : (
    <button className="btn-danger" type="button" onClick={() => setConfirming(true)}>
      <Trash2 size={15} /> Excluir
    </button>
  );
}
