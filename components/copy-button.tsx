"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <button type="button" className="btn-secondary" onClick={copy}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      {copied ? "Copiado" : label}
    </button>
  );
}
