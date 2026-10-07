/**
 * Zona horaria de la explotación. El servidor (Vercel) corre en UTC, así que
 * todo cálculo de "hoy" pasa por aquí para no desfasarse de madrugada.
 */
export const APP_TIME_ZONE = "Europe/Madrid";

/** Año, mes (1-12) y día de "ahora" en la zona horaria de la explotación. */
export function nowParts(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") };
}

/**
 * Devuelve la fecha actual en formato YYYY-MM-DD (zona de la explotación).
 * Útil como valor por defecto en inputs type="date".
 */
export function todayIso(): string {
  const { year, month, day } = nowParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Suma `days` días a una fecha YYYY-MM-DD y devuelve YYYY-MM-DD.
 */
export function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const yyyy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Días naturales de `from` a `to` (ambas YYYY-MM-DD). Negativo si `to` es anterior. */
export function daysBetweenIso(from: string, to: string): number {
  const [y1, m1, d1] = from.split("-").map(Number);
  const [y2, m2, d2] = to.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** Días desde hoy hasta `iso` (0 = hoy, negativo = pasado). */
export function daysUntil(iso: string): number {
  return daysBetweenIso(todayIso(), iso);
}

/** Edad legible a partir de la fecha de nacimiento: "8 meses", "3 años". */
export function ageLabel(birthIso: string | null | undefined): string | null {
  if (!birthIso) return null;
  const days = daysBetweenIso(birthIso, todayIso());
  if (days < 0) return null;
  if (days < 60) return `${days} ${days === 1 ? "día" : "días"}`;
  const months = Math.floor(days / 30.44);
  if (months < 24) return `${months} meses`;
  const years = Math.floor(days / 365.25);
  return `${years} años`;
}

/** Etiqueta relativa corta: "Hoy", "Mañana", "En 5d", "Hace 3d". */
export function relativeDayLabel(days: number): string {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  if (days === -1) return "Ayer";
  if (days > 0) return `En ${days}d`;
  return `Hace ${-days}d`;
}

export const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

export const MONTHS_ES_SHORT = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
] as const;

/** Valores por defecto; los reales se leen de ajustes (lib/settings.ts). */
export const SHEEP_GESTATION_DAYS = 150;
export const RABBIT_GESTATION_DAYS = 31;
