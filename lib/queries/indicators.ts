import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { addDaysIso, daysBetweenIso, todayIso } from "@/lib/dates";

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

// ─── Consultas base (pocas, agregadas; sin N+1) ───────────────────────────

type BreedingRow = {
  animal_id: number;
  breeding_id: number;
  insemination_date: string;
  expected_birth_date: string;
  actual_birth_date: string | null;
  offspring: number;
  deaths: number;
};

type AnimalRow = {
  id: number;
  birth_date: string | null;
  status: string;
};

/** Tablas según especie (nombres SQL fijos, nunca entrada del usuario). */
const T = {
  oveja: {
    animals: sql.raw("sheep"),
    breedings: sql.raw("sheep_breedings"),
    fk: sql.raw("sheep_id"),
    diseases: sql.raw("sheep_diseases"),
    vaccines: sql.raw("sheep_vaccines"),
  },
  coneja: {
    animals: sql.raw("rabbits"),
    breedings: sql.raw("rabbit_breedings"),
    fk: sql.raw("rabbit_id"),
    diseases: sql.raw("rabbit_diseases"),
    vaccines: sql.raw("rabbit_vaccines"),
  },
} as const;

/** Una fila por crianza con sus crías y bajas naturales ya agregadas. */
async function breedingRows(kind: AnimalKind, where?: SQL): Promise<BreedingRow[]> {
  const t = T[kind];
  const offspring =
    kind === "oveja"
      ? sql`(select count(*) from lambs l where l.breeding_id = b.id)::int`
      : sql`coalesce((select sum(lt.initial_units) from litters lt where lt.breeding_id = b.id), 0)::int`;
  const deaths =
    kind === "oveja"
      ? sql`(select count(*) from lambs l where l.breeding_id = b.id and l.status = 'muerto_natural')::int`
      : sql`coalesce((select sum(lt.natural_deaths) from litters lt where lt.breeding_id = b.id), 0)::int`;
  const rows = await db.execute<BreedingRow>(sql`
    select b.${t.fk} as animal_id,
           b.id as breeding_id,
           b.insemination_date::text as insemination_date,
           b.expected_birth_date::text as expected_birth_date,
           b.actual_birth_date::text as actual_birth_date,
           ${offspring} as offspring,
           ${deaths} as deaths
    from ${t.breedings} b
    ${where ? sql`where ${where}` : sql``}
    order by b.insemination_date asc, b.id asc
  `);
  return [...rows];
}

interface ReproStats {
  births: number;
  offspring: number;
  deaths: number;
  prolificacy: number | null;
  mortalityPct: number | null;
  avgBirthIntervalDays: number | null;
  lastBirth: string | null;
  pregnancy: { breedingId: number; expectedBirthDate: string } | null;
}

/** Agrega las crianzas de un animal (filas ordenadas por inseminación asc). */
function reproStats(rows: BreedingRow[]): ReproStats {
  const born = rows.filter((r) => r.actual_birth_date);
  const births = born.length;
  const offspring = born.reduce((s, r) => s + r.offspring, 0);
  const deaths = born.reduce((s, r) => s + r.deaths, 0);
  const birthDates = born.map((r) => r.actual_birth_date!).sort();
  const lastBirth = birthDates.at(-1) ?? null;
  const avgBirthIntervalDays =
    births >= 2
      ? Math.round(daysBetweenIso(birthDates[0], birthDates[births - 1]) / (births - 1))
      : null;
  // Crianza en curso = la más reciente sin parto real.
  const open = rows.filter((r) => !r.actual_birth_date).at(-1);
  return {
    births,
    offspring,
    deaths,
    prolificacy: births > 0 ? round1(offspring / births) : null,
    mortalityPct: offspring > 0 ? round1((deaths / offspring) * 100) : null,
    avgBirthIntervalDays,
    lastBirth,
    pregnancy: open
      ? { breedingId: open.breeding_id, expectedBirthDate: open.expected_birth_date }
      : null,
  };
}

const CULL = {
  oveja: { minProlificacy: 1, maxAgeYears: 7 },
  coneja: { minProlificacy: 5, maxAgeYears: 3 },
} as const;

/** Regla de desvieje. Devuelve el motivo en español o null. */
function cullReason(
  kind: AnimalKind,
  animal: { birth_date: string | null; status: string },
  st: ReproStats,
  today: string,
): string | null {
  const rule = CULL[kind];
  if (st.births >= 2 && st.prolificacy !== null && st.prolificacy < rule.minProlificacy) {
    return `Baja prolificidad (${fmt1(st.prolificacy)} crías por parto)`;
  }
  if (
    animal.status === "activo" &&
    st.births >= 1 &&
    !st.pregnancy &&
    st.lastBirth &&
    daysBetweenIso(st.lastBirth, today) > 400
  ) {
    return `Lleva ${daysBetweenIso(st.lastBirth, today)} días sin parir`;
  }
  if (animal.birth_date) {
    const years = Math.floor(daysBetweenIso(animal.birth_date, today) / 365.25);
    if (years > rule.maxAgeYears) return `Edad avanzada (${years} años)`;
  }
  return null;
}

function round1(n: number) {
  return Math.round(n * 10) / 10;
}
function fmt1(n: number) {
  return n.toLocaleString("es-ES", { maximumFractionDigits: 1 });
}
function groupBy<T>(rows: T[], key: (r: T) => number): Map<number, T[]> {
  const m = new Map<number, T[]>();
  for (const r of rows) {
    const k = key(r);
    const arr = m.get(k);
    if (arr) arr.push(r);
    else m.set(k, [r]);
  }
  return m;
}

// ─── API pública ──────────────────────────────────────────────────────────

export async function getAnimalKpis(
  kind: AnimalKind,
  animalId: number,
): Promise<AnimalKpis> {
  const t = T[kind];
  const fkTx = kind === "oveja" ? sql.raw("sheep_id") : sql.raw("rabbit_id");
  const [animalRows, rows, money] = await Promise.all([
    db.execute<AnimalRow>(sql`
      select id, birth_date::text as birth_date, status::text as status
      from ${t.animals} where id = ${animalId}
    `),
    breedingRows(kind, sql`b.${t.fk} = ${animalId}`),
    db.execute<{ income: string; expenses: string }>(sql`
      select coalesce(sum(amount_eur) filter (where type = 'ingreso'), 0)::text as income,
             coalesce(sum(amount_eur) filter (where type = 'gasto'), 0)::text as expenses
      from transactions where ${fkTx} = ${animalId}
    `),
  ]);
  const animal = animalRows[0];
  const st = reproStats(rows);
  const income = Number(money[0]?.income ?? 0);
  const expenses = Number(money[0]?.expenses ?? 0);
  const reason = animal ? cullReason(kind, animal, st, todayIso()) : null;
  return {
    births: st.births,
    offspring: st.offspring,
    prolificacy: st.prolificacy,
    mortalityPct: st.mortalityPct,
    avgBirthIntervalDays: st.avgBirthIntervalDays,
    income,
    expenses,
    profit: Math.round((income - expenses) * 100) / 100,
    pregnancy: animal?.status === "activo" ? st.pregnancy : null,
    cullCandidate: animal?.status === "activo" && reason !== null,
    cullReason: animal?.status === "activo" ? reason : null,
  };
}

/** Mapa id → KPIs ligeros para pintar chips en listados (gestante, desvieje). */
export async function getAnimalFlags(
  kind: AnimalKind,
): Promise<
  Map<number, { pregnantUntil: string | null; inTreatment: boolean; cullCandidate: boolean; vaccineOverdue: boolean }>
> {
  const t = T[kind];
  const today = todayIso();
  const [animals, rows, treated, overdue] = await Promise.all([
    db.execute<AnimalRow>(sql`
      select id, birth_date::text as birth_date, status::text as status
      from ${t.animals} where status = 'activo'
    `),
    breedingRows(
      kind,
      sql`b.${t.fk} in (select id from ${t.animals} where status = 'activo')`,
    ),
    db.execute<{ id: number }>(sql`
      select distinct ${t.fk} as id from ${t.diseases} where resolved = false
    `),
    db.execute<{ id: number }>(sql`
      select distinct v.${t.fk} as id
      from ${t.vaccines} v
      where v.next_dose_date < ${today}::date
        and not exists (
          select 1 from ${t.vaccines} v2
          where v2.${t.fk} = v.${t.fk}
            and lower(trim(v2.type)) = lower(trim(v.type))
            and (v2.date > v.date or (v2.date = v.date and v2.id > v.id))
        )
    `),
  ]);
  const byAnimal = groupBy(rows, (r) => r.animal_id);
  const treatedSet = new Set(treated.map((r) => r.id));
  const overdueSet = new Set(overdue.map((r) => r.id));
  const out = new Map<
    number,
    { pregnantUntil: string | null; inTreatment: boolean; cullCandidate: boolean; vaccineOverdue: boolean }
  >();
  for (const a of animals) {
    const st = reproStats(byAnimal.get(a.id) ?? []);
    out.set(a.id, {
      pregnantUntil: st.pregnancy?.expectedBirthDate ?? null,
      inTreatment: treatedSet.has(a.id),
      cullCandidate: cullReason(kind, a, st, today) !== null,
      vaccineOverdue: overdueSet.has(a.id),
    });
  }
  return out;
}

export async function getHerdKpis(kind: AnimalKind): Promise<HerdKpis> {
  const t = T[kind];
  const today = todayIso();
  const since = addDaysIso(today, -365);
  const fkTx = kind === "oveja" ? sql.raw("sheep_id") : sql.raw("rabbit_id");
  const [counts, recent, money] = await Promise.all([
    db.execute<{ active: number; pregnant: number; in_treatment: number }>(sql`
      select
        (select count(*) from ${t.animals} where status = 'activo')::int as active,
        (select count(distinct b.${t.fk}) from ${t.breedings} b
           join ${t.animals} a on a.id = b.${t.fk}
           where a.status = 'activo' and b.actual_birth_date is null)::int as pregnant,
        (select count(distinct d.${t.fk}) from ${t.diseases} d
           join ${t.animals} a on a.id = d.${t.fk}
           where a.status = 'activo' and d.resolved = false)::int as in_treatment
    `),
    breedingRows(kind, sql`b.actual_birth_date >= ${since}::date`),
    db.execute<{ income: string; expenses: string }>(sql`
      select coalesce(sum(amount_eur) filter (where type = 'ingreso'), 0)::text as income,
             coalesce(sum(amount_eur) filter (where type = 'gasto'), 0)::text as expenses
      from transactions
      where date >= ${since}::date
        and (animal_kind = ${kind} or ${fkTx} is not null)
    `),
  ]);
  const c = counts[0];
  const births = recent.length;
  const offspring = recent.reduce((s, r) => s + r.offspring, 0);
  const deaths = recent.reduce((s, r) => s + r.deaths, 0);
  const income = Number(money[0]?.income ?? 0);
  const expenses = Number(money[0]?.expenses ?? 0);
  return {
    kind,
    active: c?.active ?? 0,
    pregnant: c?.pregnant ?? 0,
    inTreatment: c?.in_treatment ?? 0,
    birthsLast12m: births,
    offspringLast12m: offspring,
    prolificacy: births > 0 ? round1(offspring / births) : null,
    mortalityPct: offspring > 0 ? round1((deaths / offspring) * 100) : null,
    profitLast12m: Math.round((income - expenses) * 100) / 100,
  };
}
