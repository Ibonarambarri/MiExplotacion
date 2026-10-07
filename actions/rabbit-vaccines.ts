"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rabbitVaccines, type RabbitVaccine } from "@/db/schema";
import { vaccineSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function refresh(rabbitId: number) {
  revalidatePath(`/conejas/${rabbitId}`);
  revalidatePath("/conejas");
  revalidatePath("/");
}

export async function createRabbitVaccineAction(
  rabbitId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = vaccineSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  await db.insert(rabbitVaccines).values({
    rabbitId,
    date: parsed.data.date,
    type: parsed.data.type.trim(),
    dose: parsed.data.dose ?? null,
    nextDoseDate: parsed.data.nextDoseDate ?? null,
    vet: parsed.data.vet ?? null,
    notes: parsed.data.notes ?? null,
  });
  refresh(rabbitId);
  return { ok: true };
}

export async function updateRabbitVaccineAction(
  rabbitId: number,
  vaccineId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = vaccineSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  await db
    .update(rabbitVaccines)
    .set({
      date: parsed.data.date,
      type: parsed.data.type.trim(),
      dose: parsed.data.dose ?? null,
      nextDoseDate: parsed.data.nextDoseDate ?? null,
      vet: parsed.data.vet ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(and(eq(rabbitVaccines.id, vaccineId), eq(rabbitVaccines.rabbitId, rabbitId)));
  refresh(rabbitId);
  return { ok: true };
}

/** Borra y devuelve la fila para poder deshacer. */
export async function deleteRabbitVaccineAction(
  rabbitId: number,
  vaccineId: number,
): Promise<ActionResult<RabbitVaccine>> {
  const [row] = await db
    .delete(rabbitVaccines)
    .where(and(eq(rabbitVaccines.id, vaccineId), eq(rabbitVaccines.rabbitId, rabbitId)))
    .returning();
  refresh(rabbitId);
  return { ok: true, data: row };
}

/** Deshacer: reinserta la vacuna borrada con los mismos datos e id. */
export async function restoreRabbitVaccineAction(
  rabbitId: number,
  row: RabbitVaccine,
): Promise<ActionResult> {
  await db
    .insert(rabbitVaccines)
    .values({
      id: row.id,
      rabbitId,
      date: row.date,
      type: row.type,
      dose: row.dose,
      nextDoseDate: row.nextDoseDate,
      vet: row.vet,
      notes: row.notes,
    })
    .onConflictDoNothing();
  refresh(rabbitId);
  return { ok: true };
}
