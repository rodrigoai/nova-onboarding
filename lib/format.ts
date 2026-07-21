export function digits(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCnpj(value: string) {
  const raw = digits(value).slice(0, 14);
  return raw
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value);
}

export function rate(value: string | number | { toString(): string } | null | undefined) {
  return value?.toString() ?? "";
}
