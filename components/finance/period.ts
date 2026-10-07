import { MONTHS_ES } from "@/lib/dates";

export type Period =
  | { kind: "month"; year: number; month: number }
  | { kind: "year"; year: number };

export function periodLabel(p: Period): string {
  if (p.kind === "year") return String(p.year);
  const m = MONTHS_ES[p.month - 1];
  return `${m.charAt(0).toUpperCase()}${m.slice(1)} ${p.year}`;
}

/** Etiqueta corta para comparativas: "septiembre", "2025". */
export function periodShortLabel(p: Period): string {
  return p.kind === "year" ? String(p.year) : MONTHS_ES[p.month - 1];
}

export function shiftPeriod(p: Period, delta: number): Period {
  if (p.kind === "year") return { kind: "year", year: p.year + delta };
  const idx = p.year * 12 + (p.month - 1) + delta;
  return { kind: "month", year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** ¿El periodo es posterior al actual? */
export function isAfter(
  p: Period,
  now: { year: number; month: number },
): boolean {
  if (p.kind === "year") return p.year > now.year;
  return p.year * 12 + p.month > now.year * 12 + now.month;
}

/** Parámetros de URL que representan el periodo. */
export function periodParams(p: Period): Record<string, string | null> {
  return p.kind === "year"
    ? { period: "year", year: String(p.year), month: null }
    : { period: null, year: String(p.year), month: String(p.month) };
}

/** Construye un query string a partir del actual aplicando un parche. */
export function withParams(
  current: URLSearchParams | Record<string, string | undefined>,
  patch: Record<string, string | null>,
): string {
  const params =
    current instanceof URLSearchParams
      ? new URLSearchParams(current.toString())
      : new URLSearchParams(
          Object.entries(current).filter(
            (e): e is [string, string] => typeof e[1] === "string",
          ),
        );
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === "") params.delete(k);
    else params.set(k, v);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}
