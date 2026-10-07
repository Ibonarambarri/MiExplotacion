import { ageLabel, daysUntil } from "@/lib/dates";
import type { AnimalListItem } from "@/lib/queries/sheep";

/** Filtros del listado (valor del parámetro `f` en la URL). */
export const LIST_FILTERS = [
  { key: "activas", label: "Activas" },
  { key: "gestantes", label: "Gestantes" },
  { key: "tratamiento", label: "En tratamiento" },
  { key: "vacuna", label: "Vacuna vencida" },
  { key: "desvieje", label: "Desvieje" },
  { key: "bajas", label: "Bajas" },
  { key: "todas", label: "Todas" },
] as const;

export type ListFilter = (typeof LIST_FILTERS)[number]["key"];

export function parseFilter(v: string | undefined): ListFilter {
  return LIST_FILTERS.some((f) => f.key === v) ? (v as ListFilter) : "activas";
}

/** Fila lista para pintar (serializable al cliente). */
export interface AnimalRowVM {
  id: number;
  name: string;
  tagId: string;
  hasNickname: boolean;
  age: string | null;
  thumb: string | null;
  status: AnimalListItem["status"];
  /** Días hasta el parto previsto (negativo = atrasado); null si no está gestante. */
  pregnantDays: number | null;
  inTreatment: boolean;
  vaccineOverdue: boolean;
  cull: boolean;
  /** Menor = requiere atención antes. */
  rank: number;
}

type Flags = Map<
  number,
  { pregnantUntil: string | null; inTreatment: boolean; cullCandidate: boolean; vaccineOverdue: boolean }
>;

export function buildRows(items: AnimalListItem[], flags: Flags): AnimalRowVM[] {
  const rows = items.map((a): AnimalRowVM => {
    const f = a.status === "activo" ? flags.get(a.id) : undefined;
    const pregnantDays = f?.pregnantUntil ? daysUntil(f.pregnantUntil) : null;
    const inTreatment = !!f?.inTreatment;
    const vaccineOverdue = !!f?.vaccineOverdue;
    const cull = !!f?.cullCandidate;
    let rank = 5;
    if (a.status !== "activo") rank = 9;
    else if (vaccineOverdue || inTreatment || (pregnantDays !== null && pregnantDays <= 14)) rank = 0;
    else if (pregnantDays !== null) rank = 1;
    else if (cull) rank = 2;
    return {
      id: a.id,
      name: a.nickname || a.tagId,
      tagId: a.tagId,
      hasNickname: !!a.nickname,
      age: ageLabel(a.birthDate),
      thumb: a.photoThumb,
      status: a.status,
      pregnantDays,
      inTreatment,
      vaccineOverdue,
      cull,
      rank,
    };
  });
  return rows.sort(
    (x, y) =>
      x.rank - y.rank ||
      (x.pregnantDays ?? 9999) - (y.pregnantDays ?? 9999) ||
      x.tagId.localeCompare(y.tagId, "es", { numeric: true }),
  );
}

export function matchesFilter(r: AnimalRowVM, f: ListFilter): boolean {
  switch (f) {
    case "activas":
      return r.status === "activo";
    case "gestantes":
      return r.pregnantDays !== null;
    case "tratamiento":
      return r.inTreatment;
    case "vacuna":
      return r.vaccineOverdue;
    case "desvieje":
      return r.cull;
    case "bajas":
      return r.status !== "activo";
    case "todas":
      return true;
  }
}

export function matchesSearch(r: AnimalRowVM, q: string): boolean {
  if (!q) return true;
  const n = normalize(q);
  return normalize(r.name).includes(n) || normalize(r.tagId).includes(n);
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
