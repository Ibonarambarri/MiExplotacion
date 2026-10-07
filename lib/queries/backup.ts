import "server-only";
import { and, eq, getTableName, gte, is, lte } from "drizzle-orm";
import { PgTable } from "drizzle-orm/pg-core";
import { db, schema } from "@/lib/db";

/**
 * Tablas que no se exportan: las suscripciones push contienen claves del
 * dispositivo y no tienen valor como copia de seguridad.
 */
const EXCLUDED = new Set(["push_subscriptions"]);

export interface Backup {
  app: "mi-explotacion";
  version: 1;
  exportedAt: string;
  tables: Record<string, unknown[]>;
  counts: Record<string, number>;
}

/**
 * Vuelca todas las tablas del esquema (SOLO LECTURA). Recorre las exportaciones
 * de db/schema.ts, así que cualquier tabla nueva entra automáticamente.
 */
export async function buildBackup(): Promise<Backup> {
  const tables = (Object.values(schema) as unknown[]).filter(
    (v): v is PgTable => is(v, PgTable),
  );

  const entries = await Promise.all(
    tables
      .map((t) => [getTableName(t), t] as const)
      .filter(([name]) => !EXCLUDED.has(name))
      .map(async ([name, table]) => {
        const rows = await db.select().from(table);
        return [name, rows as unknown[]] as const;
      }),
  );

  entries.sort((a, b) => a[0].localeCompare(b[0]));
  const out: Record<string, unknown[]> = Object.fromEntries(entries);
  const counts = Object.fromEntries(entries.map(([n, r]) => [n, r.length]));

  return {
    app: "mi-explotacion",
    version: 1,
    exportedAt: new Date().toISOString(),
    tables: out,
    counts,
  };
}

// ─── Libro de explotación (solo lectura) ────────────────────────────────────

export type BookKind = "oveja" | "coneja";

export interface BookAnimal {
  kind: BookKind;
  tagId: string;
  nickname: string | null;
  birthDate: string | null;
}

export interface BookMovement extends BookAnimal {
  date: string;
  /** Alta: "nacimiento" | "entrada". Baja: estado (vendido, muerto, sacrificado). */
  reason: string;
  detail?: string | null;
}

export interface BookVaccine {
  kind: BookKind;
  tagId: string;
  date: string;
  type: string;
  dose: string | null;
  vet: string | null;
  nextDoseDate: string | null;
}

export interface BookTreatment {
  kind: BookKind;
  tagId: string;
  startDate: string;
  name: string;
  medication: string | null;
  dose: string | null;
  resolvedDate: string | null;
  resolved: boolean;
}

export interface FarmBook {
  year: number;
  census: {
    sheep: BookAnimal[];
    rabbits: BookAnimal[];
    lambsAlive: number;
    kitsAlive: number;
  };
  altas: BookMovement[];
  bajas: BookMovement[];
  vaccines: BookVaccine[];
  treatments: BookTreatment[];
}

function inYear(iso: string | null | undefined, year: number): boolean {
  return !!iso && iso.startsWith(`${year}-`);
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Datos del libro de explotación para un año natural. Solo lectura. */
export async function buildFarmBook(year: number): Promise<FarmBook> {
  const { sheep, rabbits, sheepVaccines, rabbitVaccines, sheepDiseases, rabbitDiseases, lambs, litters } =
    schema;
  const from = `${year}-01-01`;
  const to = `${year}-12-31`;

  const animalCols = <T extends typeof sheep | typeof rabbits>(t: T) => ({
    id: t.id,
    tagId: t.tagId,
    nickname: t.nickname,
    birthDate: t.birthDate,
    status: t.status,
    deathDate: t.deathDate,
    deathCause: t.deathCause,
    createdAt: t.createdAt,
  });

  const [
    sheepRows,
    rabbitRows,
    lambRows,
    litterRows,
    sv,
    rv,
    sd,
    rd,
  ] = await Promise.all([
    db.select(animalCols(sheep)).from(sheep),
    db.select(animalCols(rabbits)).from(rabbits),
    db.select({ status: lambs.status }).from(lambs),
    db
      .select({ currentUnits: litters.currentUnits, slaughterDate: litters.slaughterDate })
      .from(litters),
    db
      .select({
        tagId: sheep.tagId,
        date: sheepVaccines.date,
        type: sheepVaccines.type,
        dose: sheepVaccines.dose,
        vet: sheepVaccines.vet,
        nextDoseDate: sheepVaccines.nextDoseDate,
      })
      .from(sheepVaccines)
      .innerJoin(sheep, eq(sheep.id, sheepVaccines.sheepId))
      .where(and(gte(sheepVaccines.date, from), lte(sheepVaccines.date, to))),
    db
      .select({
        tagId: rabbits.tagId,
        date: rabbitVaccines.date,
        type: rabbitVaccines.type,
        dose: rabbitVaccines.dose,
        vet: rabbitVaccines.vet,
        nextDoseDate: rabbitVaccines.nextDoseDate,
      })
      .from(rabbitVaccines)
      .innerJoin(rabbits, eq(rabbits.id, rabbitVaccines.rabbitId))
      .where(and(gte(rabbitVaccines.date, from), lte(rabbitVaccines.date, to))),
    db
      .select({
        tagId: sheep.tagId,
        startDate: sheepDiseases.startDate,
        name: sheepDiseases.name,
        medication: sheepDiseases.medication,
        dose: sheepDiseases.dose,
        resolved: sheepDiseases.resolved,
        resolvedDate: sheepDiseases.resolvedDate,
      })
      .from(sheepDiseases)
      .innerJoin(sheep, eq(sheep.id, sheepDiseases.sheepId))
      .where(lte(sheepDiseases.startDate, to)),
    db
      .select({
        tagId: rabbits.tagId,
        startDate: rabbitDiseases.startDate,
        name: rabbitDiseases.name,
        medication: rabbitDiseases.medication,
        dose: rabbitDiseases.dose,
        resolved: rabbitDiseases.resolved,
        resolvedDate: rabbitDiseases.resolvedDate,
      })
      .from(rabbitDiseases)
      .innerJoin(rabbits, eq(rabbits.id, rabbitDiseases.rabbitId))
      .where(lte(rabbitDiseases.startDate, to)),
  ]);

  type Row = (typeof sheepRows)[number];
  const tagged = [
    ...sheepRows.map((r) => ({ ...r, kind: "oveja" as const })),
    ...rabbitRows.map((r) => ({ ...r, kind: "coneja" as const })),
  ];
  const base = (r: Row & { kind: BookKind }): BookAnimal => ({
    kind: r.kind,
    tagId: r.tagId,
    nickname: r.nickname,
    birthDate: r.birthDate,
  });
  const byTag = (a: { tagId: string }, b: { tagId: string }) =>
    a.tagId.localeCompare(b.tagId, "es", { numeric: true });
  const byDate = (a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date);

  const altas: BookMovement[] = [];
  const bajas: BookMovement[] = [];
  for (const r of tagged) {
    const created = toIsoDate(r.createdAt);
    if (inYear(r.birthDate, year)) {
      altas.push({ ...base(r), date: r.birthDate!, reason: "nacimiento" });
    } else if (inYear(created, year)) {
      altas.push({ ...base(r), date: created, reason: "entrada" });
    }
    if (r.status !== "activo" && inYear(r.deathDate, year)) {
      bajas.push({ ...base(r), date: r.deathDate!, reason: r.status, detail: r.deathCause });
    }
  }

  // Tratamientos activos en algún momento del año.
  const treatments: BookTreatment[] = [
    ...sd.map((t) => ({ ...t, kind: "oveja" as const })),
    ...rd.map((t) => ({ ...t, kind: "coneja" as const })),
  ]
    .filter((t) => !t.resolved || !t.resolvedDate || t.resolvedDate >= from)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return {
    year,
    census: {
      sheep: tagged.filter((r) => r.kind === "oveja" && r.status === "activo").map(base).sort(byTag),
      rabbits: tagged.filter((r) => r.kind === "coneja" && r.status === "activo").map(base).sort(byTag),
      lambsAlive: lambRows.filter((l) => l.status === "vivo").length,
      kitsAlive: litterRows
        .filter((l) => !l.slaughterDate)
        .reduce((n, l) => n + (l.currentUnits ?? 0), 0),
    },
    altas: altas.sort(byDate),
    bajas: bajas.sort(byDate),
    vaccines: [
      ...sv.map((v) => ({ ...v, kind: "oveja" as const })),
      ...rv.map((v) => ({ ...v, kind: "coneja" as const })),
    ].sort(byDate),
    treatments,
  };
}
