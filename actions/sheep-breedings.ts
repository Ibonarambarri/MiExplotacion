"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheepBreedings, lambs } from "@/db/schema";
import {
  sheepBreedingSchema,
  lambSchema,
  fdObject,
  flattenZodError,
} from "@/lib/validations";
import { addDaysIso, SHEEP_GESTATION_DAYS } from "@/lib/dates";
import type { ActionResult } from "@/actions/sheep";

function refresh(sheepId: number, breedingId?: number) {
  revalidatePath(`/ovejas/${sheepId}`);
  if (breedingId) {
    revalidatePath(`/ovejas/${sheepId}/crianzas/${breedingId}`);
  }
  revalidatePath("/");
}

// ─── Breeding ─────────────────────────────────────────────────────────────
export async function createSheepBreedingAction(
  sheepId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const parsed = sheepBreedingSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const expected =
    parsed.data.expectedBirthDate ??
    addDaysIso(parsed.data.inseminationDate, SHEEP_GESTATION_DAYS);

  const [row] = await db
    .insert(sheepBreedings)
    .values({
      sheepId,
      inseminationDate: parsed.data.inseminationDate,
      expectedBirthDate: expected,
      actualBirthDate: parsed.data.actualBirthDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: sheepBreedings.id });

  refresh(sheepId, row.id);
  return { ok: true, data: { id: row.id } };
}

export async function updateSheepBreedingAction(
  sheepId: number,
  breedingId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = sheepBreedingSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const expected =
    parsed.data.expectedBirthDate ??
    addDaysIso(parsed.data.inseminationDate, SHEEP_GESTATION_DAYS);

  await db
    .update(sheepBreedings)
    .set({
      inseminationDate: parsed.data.inseminationDate,
      expectedBirthDate: expected,
      actualBirthDate: parsed.data.actualBirthDate ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(sheepBreedings.id, breedingId));

  refresh(sheepId, breedingId);
  return { ok: true };
}

export async function deleteSheepBreedingAction(
  sheepId: number,
  breedingId: number,
): Promise<ActionResult> {
  await db.delete(sheepBreedings).where(eq(sheepBreedings.id, breedingId));
  refresh(sheepId);
  return { ok: true };
}

// ─── Lambs ────────────────────────────────────────────────────────────────
export async function createLambAction(
  sheepId: number,
  breedingId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = lambSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  await db.insert(lambs).values({
    breedingId,
    gender: parsed.data.gender ?? null,
    nickname: parsed.data.nickname ?? null,
    status: parsed.data.status,
    slaughterDate: parsed.data.slaughterDate ?? null,
    deadWeightKg: parsed.data.deadWeightKg ?? null,
    saleDate: parsed.data.saleDate ?? null,
    salePriceEur: parsed.data.salePriceEur ?? null,
    notes: parsed.data.notes ?? null,
  });
  refresh(sheepId, breedingId);
  return { ok: true };
}

export async function updateLambAction(
  sheepId: number,
  breedingId: number,
  lambId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = lambSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  await db
    .update(lambs)
    .set({
      gender: parsed.data.gender ?? null,
      nickname: parsed.data.nickname ?? null,
      status: parsed.data.status,
      slaughterDate: parsed.data.slaughterDate ?? null,
      deadWeightKg: parsed.data.deadWeightKg ?? null,
      saleDate: parsed.data.saleDate ?? null,
      salePriceEur: parsed.data.salePriceEur ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(lambs.id, lambId));
  refresh(sheepId, breedingId);
  return { ok: true };
}

export async function deleteLambAction(
  sheepId: number,
  breedingId: number,
  lambId: number,
): Promise<ActionResult> {
  await db.delete(lambs).where(eq(lambs.id, lambId));
  refresh(sheepId, breedingId);
  return { ok: true };
}
