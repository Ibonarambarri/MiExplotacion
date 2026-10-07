const eur = new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" });
const eurCompact = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});
const pct = new Intl.NumberFormat("es-ES", {
  style: "percent",
  maximumFractionDigits: 0,
});

export function fmtEur(n: number): string {
  return eur.format(n);
}

/** Importe con signo explícito: "+12,00 €" / "−12,00 €" (menos tipográfico). */
export function fmtSigned(n: number): string {
  if (n === 0) return eur.format(0);
  return `${n > 0 ? "+" : "−"}${eur.format(Math.abs(n))}`;
}

export function fmtCompact(n: number): string {
  return eurCompact.format(n);
}

export function fmtPct(ratio: number): string {
  return pct.format(ratio);
}

/** Variación relativa; null si no hay base de comparación. */
export function variation(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / Math.abs(previous);
}
