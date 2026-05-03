"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rabbitBreedings, litters } from "@/db/schema";
import {
  rabbitBreedingSchema,
  litterSchema,
  fdObject,
  flattenZodError,
} from "@/lib/validations";
import { addDaysIso, RABBIT_GESTATION_DAYS } from "@/lib/dates";
import type { ActionResult } from "@/actions/sheep";

function refresh(rabbitId: number, breedingId?: number) {
  revalidatePath(`/conejas/${rabbitId}`);
  if (breedingId) {
    revalidatePath(`/conejas/${rabbitId}/crianzas/${breedingId}`);
  }
  revalidatePath("/");
}

// ─── Breeding ─────────────────────────────────────────────────────────────
export async function createRabbitBreedingAction(
  rabbitId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const parsed = rabbitBreedingSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const expected =
    parsed.data.expectedBirthDate ??
    addDaysIso(parsed.data.inseminationDate, RABBIT_GESTATION_DAYS);

  const [row] = await db
    .insert(rabbitBreedings)
    .values({
      rabbitId,
      inseminationDate: parsed.data.inseminationDate,
      expectedBirthDate: expected,
      actualBirthDate: parsed.data.actualBirthDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: rabbitBreedings.id });

  refresh(rabbitId, row.id);
  return { ok: true, data: { id: row.id } };
}

export async function updateRabbitBreedingAction(
  rabbitId: number,
  breedingId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = rabbitBreedingSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const expected =
    parsed.data.expectedBirthDate ??
    addDaysIso(parsed.data.inseminationDate, RABBIT_GESTATION_DAYS);

  await db
    .update(rabbitBreedings)
    .set({
      inseminationDate: parsed.data.inseminationDate,
      expectedBirthDate: expected,
      actualBirthDate: parsed.data.actualBirthDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(rabbitBreedings.id, breedingId));

  refresh(rabbitId, breedingId);
  return { ok: true };
}

export async function deleteRabbitBreedingAction(
  rabbitId: number,
  breedingId: number,
): Promise<ActionResult> {
  await db.delete(rabbitBreedings).where(eq(rabbitBreedings.id, breedingId));
  refresh(rabbitId);
  return { ok: true };
}

// ─── Litter ───────────────────────────────────────────────────────────────
export async function createLitterAction(
  rabbitId: number,
  breedingId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = litterSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const initial = parsed.data.initialUnits ?? 0;
  const current = parsed.data.currentUnits ?? initial;

  await db.insert(litters).values({
    breedingId,
    initialUnits: initial,
    currentUnits: current,
    naturalDeaths: parsed.data.naturalDeaths ?? 0,
    averageWeightKg: parsed.data.averageWeightKg ?? null,
    slaughterDate: parsed.data.slaughterDate ?? null,
    slaughteredUnits: parsed.data.slaughteredUnits ?? null,
    notes: parsed.data.notes ?? null,
  });

  refresh(rabbitId, breedingId);
  return { ok: true };
}

export async function updateLitterAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = litterSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }

  await db
    .update(litters)
    .set({
      initialUnits: parsed.data.initialUnits ?? 0,
      currentUnits: parsed.data.currentUnits ?? 0,
      naturalDeaths: parsed.data.naturalDeaths ?? 0,
      averageWeightKg: parsed.data.averageWeightKg ?? null,
      slaughterDate: parsed.data.slaughterDate ?? null,
      slaughteredUnits: parsed.data.slaughteredUnits ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(litters.id, litterId));

  refresh(rabbitId, breedingId);
  return { ok: true };
}

export async function deleteLitterAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
): Promise<ActionResult> {
  await db.delete(litters).where(eq(litters.id, litterId));
  refresh(rabbitId, breedingId);
  return { ok: true };
}

/**
 * Acción rápida: registrar muerte natural de un gazapo.
 * Incrementa naturalDeaths y reduce currentUnits en 1 (sin bajar de 0).
 */
export async function recordLitterDeathAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
): Promise<ActionResult> {
  await db
    .update(litters)
    .set({
      naturalDeaths: sql`${litters.naturalDeaths} + 1`,
      currentUnits: sql`GREATEST(${litters.currentUnits} - 1, 0)`,
    })
    .where(eq(litters.id, litterId));

  refresh(rabbitId, breedingId);
  return { ok: true };
}

/**
 * Acción rápida: registrar matanza.
 * Marca fecha de matanza y unidades sacrificadas (todos los actuales si no se indica).
 */
export async function recordLitterSlaughterAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const date = String(formData.get("slaughterDate") ?? "");
  const unitsRaw = String(formData.get("slaughteredUnits") ?? "");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, error: "Fecha de matanza inválida." };
  }
  const units = unitsRaw ? Number(unitsRaw) : null;
  if (units !== null && (!Number.isInteger(units) || units < 0)) {
    return { ok: false, error: "Unidades inválidas." };
  }

  await db
    .update(litters)
    .set({
      slaughterDate: date,
      slaughteredUnits: units,
      currentUnits: units !== null
        ? sql`GREATEST(${litters.currentUnits} - ${units}, 0)`
        : 0,
    })
    .where(eq(litters.id, litterId));

  refresh(rabbitId, breedingId);
  return { ok: true };
}
