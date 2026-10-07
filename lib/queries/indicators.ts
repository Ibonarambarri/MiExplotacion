import "server-only";

/**
 * Indicadores reproductivos y económicos.
 *
 * CONTRATO COMPARTIDO: las firmas de este archivo las consumen la ficha del
 * animal, Inicio y Finanzas. La implementación la completa el área de
 * crianzas; no cambies las firmas sin actualizar a los consumidores.
 */

export type AnimalKind = "oveja" | "coneja";

export interface AnimalKpis {
  /** Número de partos registrados (crianzas con fecha de parto real). */
  births: number;
  /** Crías nacidas en total (corderos o unidades iniciales de camada). */
  offspring: number;
  /** Crías por parto (prolificidad). null si no hay partos. */
  prolificacy: number | null;
  /** % de crías muertas de forma natural. null si no hay crías. */
  mortalityPct: number | null;
  /** Intervalo medio entre partos en días. null si < 2 partos. */
  avgBirthIntervalDays: number | null;
  /** Ingresos imputados al animal (ventas de sus crías + movimientos). */
  income: number;
  /** Gastos imputados al animal. */
  expenses: number;
  /** income - expenses */
  profit: number;
  /** Crianza en curso (inseminada sin parto real), si la hay. */
  pregnancy: { breedingId: number; expectedBirthDate: string } | null;
  /** Sugerencia de desvieje: baja productividad sostenida. */
  cullCandidate: boolean;
  cullReason: string | null;
}

export interface HerdKpis {
  kind: AnimalKind;
  active: number;
  pregnant: number;
  inTreatment: number;
  birthsLast12m: number;
  offspringLast12m: number;
  prolificacy: number | null;
  mortalityPct: number | null;
  /** Ingresos - gastos de la especie en los últimos 12 meses. */
  profitLast12m: number;
}

const EMPTY_ANIMAL: AnimalKpis = {
  births: 0,
  offspring: 0,
  prolificacy: null,
  mortalityPct: null,
  avgBirthIntervalDays: null,
  income: 0,
  expenses: 0,
  profit: 0,
  pregnancy: null,
  cullCandidate: false,
  cullReason: null,
};

export async function getAnimalKpis(
  kind: AnimalKind,
  animalId: number,
): Promise<AnimalKpis> {
  void kind;
  void animalId;
  return EMPTY_ANIMAL; // TODO: implementado por el área de crianzas
}

/** Mapa id → KPIs ligeros para pintar chips en listados (gestante, desvieje). */
export async function getAnimalFlags(
  kind: AnimalKind,
): Promise<
  Map<number, { pregnantUntil: string | null; inTreatment: boolean; cullCandidate: boolean; vaccineOverdue: boolean }>
> {
  void kind;
  return new Map(); // TODO: implementado por el área de crianzas
}

export async function getHerdKpis(kind: AnimalKind): Promise<HerdKpis> {
  return {
    kind,
    active: 0,
    pregnant: 0,
    inTreatment: 0,
    birthsLast12m: 0,
    offspringLast12m: 0,
    prolificacy: null,
    mortalityPct: null,
    profitLast12m: 0,
  }; // TODO: implementado por el área de crianzas
}
