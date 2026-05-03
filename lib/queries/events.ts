import { db } from "@/lib/db";
import {
  sheep,
  rabbits,
  sheepVaccines,
  rabbitVaccines,
  sheepBreedings,
  rabbitBreedings,
  sheepDiseases,
  rabbitDiseases,
} from "@/db/schema";
import { and, eq, gte, isNotNull, isNull, lte } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { addDaysIso, todayIso } from "@/lib/dates";

export type AnimalKind = "oveja" | "coneja";

export interface VaccineEvent {
  id: number;
  animalKind: AnimalKind;
  animalId: number;
  animalLabel: string;
  type: string;
  nextDoseDate: string;
}

export interface BirthEvent {
  id: number;
  animalKind: AnimalKind;
  animalId: number;
  animalLabel: string;
  expectedBirthDate: string;
  actualBirthDate: string | null;
}

export interface DiseaseEvent {
  id: number;
  animalKind: AnimalKind;
  animalId: number;
  animalLabel: string;
  name: string;
  startDate: string;
}

function labelFor(tagId: string, nickname: string | null): string {
  return nickname ? `${nickname} (${tagId})` : tagId;
}

// ─── Próximas vacunas ─────────────────────────────────────────────────────
export async function listUpcomingVaccines(
  daysAhead = 30,
): Promise<VaccineEvent[]> {
  const today = todayIso();
  const horizon = addDaysIso(today, daysAhead);

  const sheepRows = await db
    .select({
      id: sheepVaccines.id,
      animalId: sheep.id,
      tagId: sheep.tagId,
      nickname: sheep.nickname,
      type: sheepVaccines.type,
      nextDoseDate: sheepVaccines.nextDoseDate,
    })
    .from(sheepVaccines)
    .innerJoin(sheep, eq(sheep.id, sheepVaccines.sheepId))
    .where(
      and(
        isNotNull(sheepVaccines.nextDoseDate),
        gte(sheepVaccines.nextDoseDate, today),
        lte(sheepVaccines.nextDoseDate, horizon),
      ),
    );

  const rabbitRows = await db
    .select({
      id: rabbitVaccines.id,
      animalId: rabbits.id,
      tagId: rabbits.tagId,
      nickname: rabbits.nickname,
      type: rabbitVaccines.type,
      nextDoseDate: rabbitVaccines.nextDoseDate,
    })
    .from(rabbitVaccines)
    .innerJoin(rabbits, eq(rabbits.id, rabbitVaccines.rabbitId))
    .where(
      and(
        isNotNull(rabbitVaccines.nextDoseDate),
        gte(rabbitVaccines.nextDoseDate, today),
        lte(rabbitVaccines.nextDoseDate, horizon),
      ),
    );

  const events: VaccineEvent[] = [
    ...sheepRows.map((r) => ({
      id: r.id,
      animalKind: "oveja" as const,
      animalId: r.animalId,
      animalLabel: labelFor(r.tagId, r.nickname),
      type: r.type,
      nextDoseDate: r.nextDoseDate!,
    })),
    ...rabbitRows.map((r) => ({
      id: r.id,
      animalKind: "coneja" as const,
      animalId: r.animalId,
      animalLabel: labelFor(r.tagId, r.nickname),
      type: r.type,
      nextDoseDate: r.nextDoseDate!,
    })),
  ];
  events.sort((a, b) => a.nextDoseDate.localeCompare(b.nextDoseDate));
  return events;
}

// ─── Partos esperados ─────────────────────────────────────────────────────
export async function listUpcomingBirths(
  daysAhead = 30,
): Promise<BirthEvent[]> {
  const today = todayIso();
  const horizon = addDaysIso(today, daysAhead);

  const sheepRows = await db
    .select({
      id: sheepBreedings.id,
      animalId: sheep.id,
      tagId: sheep.tagId,
      nickname: sheep.nickname,
      expectedBirthDate: sheepBreedings.expectedBirthDate,
      actualBirthDate: sheepBreedings.actualBirthDate,
    })
    .from(sheepBreedings)
    .innerJoin(sheep, eq(sheep.id, sheepBreedings.sheepId))
    .where(
      and(
        isNull(sheepBreedings.actualBirthDate),
        gte(sheepBreedings.expectedBirthDate, today),
        lte(sheepBreedings.expectedBirthDate, horizon),
      ),
    );

  const rabbitRows = await db
    .select({
      id: rabbitBreedings.id,
      animalId: rabbits.id,
      tagId: rabbits.tagId,
      nickname: rabbits.nickname,
      expectedBirthDate: rabbitBreedings.expectedBirthDate,
      actualBirthDate: rabbitBreedings.actualBirthDate,
    })
    .from(rabbitBreedings)
    .innerJoin(rabbits, eq(rabbits.id, rabbitBreedings.rabbitId))
    .where(
      and(
        isNull(rabbitBreedings.actualBirthDate),
        gte(rabbitBreedings.expectedBirthDate, today),
        lte(rabbitBreedings.expectedBirthDate, horizon),
      ),
    );

  const events: BirthEvent[] = [
    ...sheepRows.map((r) => ({
      id: r.id,
      animalKind: "oveja" as const,
      animalId: r.animalId,
      animalLabel: labelFor(r.tagId, r.nickname),
      expectedBirthDate: r.expectedBirthDate,
      actualBirthDate: r.actualBirthDate,
    })),
    ...rabbitRows.map((r) => ({
      id: r.id,
      animalKind: "coneja" as const,
      animalId: r.animalId,
      animalLabel: labelFor(r.tagId, r.nickname),
      expectedBirthDate: r.expectedBirthDate,
      actualBirthDate: r.actualBirthDate,
    })),
  ];
  events.sort((a, b) =>
    a.expectedBirthDate.localeCompare(b.expectedBirthDate),
  );
  return events;
}

// ─── Enfermedades activas ────────────────────────────────────────────────
export async function listActiveDiseases(): Promise<DiseaseEvent[]> {
  const sheepRows = await db
    .select({
      id: sheepDiseases.id,
      animalId: sheep.id,
      tagId: sheep.tagId,
      nickname: sheep.nickname,
      name: sheepDiseases.name,
      startDate: sheepDiseases.startDate,
    })
    .from(sheepDiseases)
    .innerJoin(sheep, eq(sheep.id, sheepDiseases.sheepId))
    .where(eq(sheepDiseases.resolved, false));

  const rabbitRows = await db
    .select({
      id: rabbitDiseases.id,
      animalId: rabbits.id,
      tagId: rabbits.tagId,
      nickname: rabbits.nickname,
      name: rabbitDiseases.name,
      startDate: rabbitDiseases.startDate,
    })
    .from(rabbitDiseases)
    .innerJoin(rabbits, eq(rabbits.id, rabbitDiseases.rabbitId))
    .where(eq(rabbitDiseases.resolved, false));

  const events: DiseaseEvent[] = [
    ...sheepRows.map((r) => ({
      id: r.id,
      animalKind: "oveja" as const,
      animalId: r.animalId,
      animalLabel: labelFor(r.tagId, r.nickname),
      name: r.name,
      startDate: r.startDate,
    })),
    ...rabbitRows.map((r) => ({
      id: r.id,
      animalKind: "coneja" as const,
      animalId: r.animalId,
      animalLabel: labelFor(r.tagId, r.nickname),
      name: r.name,
      startDate: r.startDate,
    })),
  ];
  events.sort((a, b) => b.startDate.localeCompare(a.startDate));
  return events;
}

// ─── Eventos del mes para calendario ─────────────────────────────────────
export type CalendarEventType =
  | "vacuna"
  | "vacuna_dosis"
  | "parto_esperado"
  | "parto_real"
  | "enfermedad_inicio"
  | "enfermedad_fin";

export interface CalendarEvent {
  id: string; // único por tipo+id
  date: string; // YYYY-MM-DD
  type: CalendarEventType;
  title: string;
  animalKind: AnimalKind;
  animalId: number;
  animalLabel: string;
  href: string;
}

export async function listCalendarEvents(
  year: number,
  month: number, // 1-12
): Promise<CalendarEvent[]> {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const inMonth = (col: AnyPgColumn) =>
    and(gte(col, from), lte(col, to));

  // Vacunas: fecha aplicada y próxima dosis
  const [
    sVacApplied,
    sVacNext,
    rVacApplied,
    rVacNext,
    sBrExpected,
    sBrActual,
    rBrExpected,
    rBrActual,
    sDisStart,
    sDisEnd,
    rDisStart,
    rDisEnd,
  ] = await Promise.all([
    db
      .select({
        id: sheepVaccines.id,
        type: sheepVaccines.type,
        date: sheepVaccines.date,
        animalId: sheep.id,
        tagId: sheep.tagId,
        nickname: sheep.nickname,
      })
      .from(sheepVaccines)
      .innerJoin(sheep, eq(sheep.id, sheepVaccines.sheepId))
      .where(inMonth(sheepVaccines.date)),
    db
      .select({
        id: sheepVaccines.id,
        type: sheepVaccines.type,
        date: sheepVaccines.nextDoseDate,
        animalId: sheep.id,
        tagId: sheep.tagId,
        nickname: sheep.nickname,
      })
      .from(sheepVaccines)
      .innerJoin(sheep, eq(sheep.id, sheepVaccines.sheepId))
      .where(
        and(
          isNotNull(sheepVaccines.nextDoseDate),
          gte(sheepVaccines.nextDoseDate, from),
          lte(sheepVaccines.nextDoseDate, to),
        ),
      ),
    db
      .select({
        id: rabbitVaccines.id,
        type: rabbitVaccines.type,
        date: rabbitVaccines.date,
        animalId: rabbits.id,
        tagId: rabbits.tagId,
        nickname: rabbits.nickname,
      })
      .from(rabbitVaccines)
      .innerJoin(rabbits, eq(rabbits.id, rabbitVaccines.rabbitId))
      .where(inMonth(rabbitVaccines.date)),
    db
      .select({
        id: rabbitVaccines.id,
        type: rabbitVaccines.type,
        date: rabbitVaccines.nextDoseDate,
        animalId: rabbits.id,
        tagId: rabbits.tagId,
        nickname: rabbits.nickname,
      })
      .from(rabbitVaccines)
      .innerJoin(rabbits, eq(rabbits.id, rabbitVaccines.rabbitId))
      .where(
        and(
          isNotNull(rabbitVaccines.nextDoseDate),
          gte(rabbitVaccines.nextDoseDate, from),
          lte(rabbitVaccines.nextDoseDate, to),
        ),
      ),
    db
      .select({
        id: sheepBreedings.id,
        date: sheepBreedings.expectedBirthDate,
        animalId: sheep.id,
        tagId: sheep.tagId,
        nickname: sheep.nickname,
      })
      .from(sheepBreedings)
      .innerJoin(sheep, eq(sheep.id, sheepBreedings.sheepId))
      .where(inMonth(sheepBreedings.expectedBirthDate)),
    db
      .select({
        id: sheepBreedings.id,
        date: sheepBreedings.actualBirthDate,
        animalId: sheep.id,
        tagId: sheep.tagId,
        nickname: sheep.nickname,
      })
      .from(sheepBreedings)
      .innerJoin(sheep, eq(sheep.id, sheepBreedings.sheepId))
      .where(
        and(
          isNotNull(sheepBreedings.actualBirthDate),
          gte(sheepBreedings.actualBirthDate, from),
          lte(sheepBreedings.actualBirthDate, to),
        ),
      ),
    db
      .select({
        id: rabbitBreedings.id,
        date: rabbitBreedings.expectedBirthDate,
        animalId: rabbits.id,
        tagId: rabbits.tagId,
        nickname: rabbits.nickname,
      })
      .from(rabbitBreedings)
      .innerJoin(rabbits, eq(rabbits.id, rabbitBreedings.rabbitId))
      .where(inMonth(rabbitBreedings.expectedBirthDate)),
    db
      .select({
        id: rabbitBreedings.id,
        date: rabbitBreedings.actualBirthDate,
        animalId: rabbits.id,
        tagId: rabbits.tagId,
        nickname: rabbits.nickname,
      })
      .from(rabbitBreedings)
      .innerJoin(rabbits, eq(rabbits.id, rabbitBreedings.rabbitId))
      .where(
        and(
          isNotNull(rabbitBreedings.actualBirthDate),
          gte(rabbitBreedings.actualBirthDate, from),
          lte(rabbitBreedings.actualBirthDate, to),
        ),
      ),
    db
      .select({
        id: sheepDiseases.id,
        name: sheepDiseases.name,
        date: sheepDiseases.startDate,
        animalId: sheep.id,
        tagId: sheep.tagId,
        nickname: sheep.nickname,
      })
      .from(sheepDiseases)
      .innerJoin(sheep, eq(sheep.id, sheepDiseases.sheepId))
      .where(inMonth(sheepDiseases.startDate)),
    db
      .select({
        id: sheepDiseases.id,
        name: sheepDiseases.name,
        date: sheepDiseases.resolvedDate,
        animalId: sheep.id,
        tagId: sheep.tagId,
        nickname: sheep.nickname,
      })
      .from(sheepDiseases)
      .innerJoin(sheep, eq(sheep.id, sheepDiseases.sheepId))
      .where(
        and(
          isNotNull(sheepDiseases.resolvedDate),
          gte(sheepDiseases.resolvedDate, from),
          lte(sheepDiseases.resolvedDate, to),
        ),
      ),
    db
      .select({
        id: rabbitDiseases.id,
        name: rabbitDiseases.name,
        date: rabbitDiseases.startDate,
        animalId: rabbits.id,
        tagId: rabbits.tagId,
        nickname: rabbits.nickname,
      })
      .from(rabbitDiseases)
      .innerJoin(rabbits, eq(rabbits.id, rabbitDiseases.rabbitId))
      .where(inMonth(rabbitDiseases.startDate)),
    db
      .select({
        id: rabbitDiseases.id,
        name: rabbitDiseases.name,
        date: rabbitDiseases.resolvedDate,
        animalId: rabbits.id,
        tagId: rabbits.tagId,
        nickname: rabbits.nickname,
      })
      .from(rabbitDiseases)
      .innerJoin(rabbits, eq(rabbits.id, rabbitDiseases.rabbitId))
      .where(
        and(
          isNotNull(rabbitDiseases.resolvedDate),
          gte(rabbitDiseases.resolvedDate, from),
          lte(rabbitDiseases.resolvedDate, to),
        ),
      ),
  ]);

  const events: CalendarEvent[] = [];

  type VaccineRow = {
    id: number;
    type: string;
    date: string | null;
    animalId: number;
    tagId: string;
    nickname: string | null;
  };

  const pushVaccine = (
    rows: VaccineRow[],
    kind: AnimalKind,
    type: CalendarEventType,
  ) => {
    for (const r of rows) {
      if (!r.date) continue;
      events.push({
        id: `vac-${type}-${kind}-${r.id}`,
        date: r.date,
        type,
        title:
          type === "vacuna_dosis" ? `Próxima dosis · ${r.type}` : `Vacuna · ${r.type}`,
        animalKind: kind,
        animalId: r.animalId,
        animalLabel: labelFor(r.tagId, r.nickname),
        href: kind === "oveja" ? `/ovejas/${r.animalId}` : `/conejas/${r.animalId}`,
      });
    }
  };

  pushVaccine(sVacApplied, "oveja", "vacuna");
  pushVaccine(sVacNext, "oveja", "vacuna_dosis");
  pushVaccine(rVacApplied, "coneja", "vacuna");
  pushVaccine(rVacNext, "coneja", "vacuna_dosis");

  type BirthRow = {
    id: number;
    date: string | null;
    animalId: number;
    tagId: string;
    nickname: string | null;
  };

  const pushBirth = (
    rows: BirthRow[],
    kind: AnimalKind,
    type: CalendarEventType,
  ) => {
    for (const r of rows) {
      if (!r.date) continue;
      const animalHref =
        kind === "oveja" ? `/ovejas/${r.animalId}` : `/conejas/${r.animalId}`;
      events.push({
        id: `br-${type}-${kind}-${r.id}`,
        date: r.date,
        type,
        title: type === "parto_esperado" ? "Parto esperado" : "Parto",
        animalKind: kind,
        animalId: r.animalId,
        animalLabel: labelFor(r.tagId, r.nickname),
        href: `${animalHref}/crianzas/${r.id}`,
      });
    }
  };

  pushBirth(sBrExpected, "oveja", "parto_esperado");
  pushBirth(sBrActual, "oveja", "parto_real");
  pushBirth(rBrExpected, "coneja", "parto_esperado");
  pushBirth(rBrActual, "coneja", "parto_real");

  type DiseaseRow = {
    id: number;
    name: string;
    date: string | null;
    animalId: number;
    tagId: string;
    nickname: string | null;
  };

  const pushDisease = (
    rows: DiseaseRow[],
    kind: AnimalKind,
    type: CalendarEventType,
  ) => {
    for (const r of rows) {
      if (!r.date) continue;
      events.push({
        id: `dis-${type}-${kind}-${r.id}`,
        date: r.date,
        type,
        title:
          type === "enfermedad_inicio"
            ? `Inicio · ${r.name}`
            : `Resuelta · ${r.name}`,
        animalKind: kind,
        animalId: r.animalId,
        animalLabel: labelFor(r.tagId, r.nickname),
        href: kind === "oveja" ? `/ovejas/${r.animalId}` : `/conejas/${r.animalId}`,
      });
    }
  };

  pushDisease(sDisStart, "oveja", "enfermedad_inicio");
  pushDisease(sDisEnd, "oveja", "enfermedad_fin");
  pushDisease(rDisStart, "coneja", "enfermedad_inicio");
  pushDisease(rDisEnd, "coneja", "enfermedad_fin");

  events.sort((a, b) => a.date.localeCompare(b.date));
  return events;
}
