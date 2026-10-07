"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  weightRecords,
  lambs,
  litters,
  sheepBreedings,
  rabbitBreedings,
  type WeightRecord,
} from "@/db/schema";
import { weightSchema, fdObject, flattenZodError } from "@/lib/validations";
import { targetColumn, type WeightTarget } from "@/lib/queries/weights";
import type { ActionResult } from "@/actions/sheep";

/** Rutas a refrescar según el dueño del pesaje (calculadas en servidor). */
async function pathsFor(target: WeightTarget): Promise<string[]> {
  switch (target.kind) {
    case "sheep":
      return [`/ovejas/${target.id}`];
    case "rabbit":
      return [`/conejas/${target.id}`];
    case "lamb": {
      const [r] = await db
        .select({ breedingId: sheepBreedings.id, sheepId: sheepBreedings.sheepId })
        .from(lambs)
        .innerJoin(sheepBreedings, eq(sheepBreedings.id, lambs.breedingId))
        .where(eq(lambs.id, target.id))
        .limit(1);
      return r ? [`/ovejas/${r.sheepId}/crianzas/${r.breedingId}`, `/ovejas/${r.sheepId}`] : [];
    }
    case "litter": {
      const [r] = await db
        .select({ breedingId: rabbitBreedings.id, rabbitId: rabbitBreedings.rabbitId })
        .from(litters)
        .innerJoin(rabbitBreedings, eq(rabbitBreedings.id, litters.breedingId))
        .where(eq(litters.id, target.id))
        .limit(1);
      return r ? [`/conejas/${r.rabbitId}/crianzas/${r.breedingId}`, `/conejas/${r.rabbitId}`] : [];
    }
  }
}

function ownerFields(target: WeightTarget) {
  return {
    sheepId: target.kind === "sheep" ? target.id : null,
    rabbitId: target.kind === "rabbit" ? target.id : null,
    lambId: target.kind === "lamb" ? target.id : null,
    litterId: target.kind === "litter" ? target.id : null,
  };
}

/** En camadas, el "peso medio" de la ficha sigue al último pesaje. */
async function syncLitterAverage(litterId: number) {
  const [last] = await db
    .select({ w: weightRecords.weightKg })
    .from(weightRecords)
    .where(eq(weightRecords.litterId, litterId))
    .orderBy(desc(weightRecords.date), desc(weightRecords.id))
    .limit(1);
  if (last) {
    await db.update(litters).set({ averageWeightKg: last.w }).where(eq(litters.id, litterId));
  }
}

async function refresh(target: WeightTarget) {
  for (const p of await pathsFor(target)) revalidatePath(p);
}

function isTarget(t: unknown): t is WeightTarget {
  const v = t as WeightTarget;
  return (
    !!v &&
    ["sheep", "rabbit", "lamb", "litter"].includes(v.kind) &&
    Number.isInteger(v.id) &&
    v.id > 0
  );
}

export async function createWeightAction(
  target: WeightTarget,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  if (!isTarget(target)) return { ok: false, error: "Destino de pesaje inválido." };
  const parsed = weightSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  await db.insert(weightRecords).values({
    ...ownerFields(target),
    date: parsed.data.date,
    weightKg: parsed.data.weightKg,
    notes: parsed.data.notes ?? null,
  });
  if (target.kind === "litter") await syncLitterAverage(target.id);
  await refresh(target);
  return { ok: true };
}

export async function deleteWeightAction(
  target: WeightTarget,
  weightId: number,
): Promise<ActionResult<WeightRecord>> {
  if (!isTarget(target)) return { ok: false, error: "Destino de pesaje inválido." };
  const [row] = await db
    .delete(weightRecords)
    .where(and(eq(weightRecords.id, weightId), eq(targetColumn(target.kind), target.id)))
    .returning();
  if (!row) return { ok: false, error: "No se encontró el pesaje." };
  if (target.kind === "litter") await syncLitterAverage(target.id);
  await refresh(target);
  return { ok: true, data: row };
}

export async function restoreWeightAction(
  target: WeightTarget,
  row: WeightRecord,
): Promise<ActionResult> {
  if (!isTarget(target)) return { ok: false, error: "Destino de pesaje inválido." };
  await db
    .insert(weightRecords)
    .values({
      id: row.id,
      ...ownerFields(target),
      date: row.date,
      weightKg: row.weightKg,
      notes: row.notes,
    })
    .onConflictDoNothing();
  if (target.kind === "litter") await syncLitterAverage(target.id);
  await refresh(target);
  return { ok: true };
}

