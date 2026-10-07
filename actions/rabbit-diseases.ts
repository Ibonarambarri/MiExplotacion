"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rabbitDiseases, type RabbitDisease } from "@/db/schema";
import { diseaseSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function refresh(rabbitId: number) {
  revalidatePath(`/conejas/${rabbitId}`);
  revalidatePath("/conejas");
  revalidatePath("/");
}

function values(data: ReturnType<typeof diseaseSchema.parse>) {
  return {
    startDate: data.startDate,
    name: data.name.trim(),
    treatment: data.treatment ?? null,
    medication: data.medication ?? null,
    dose: data.dose ?? null,
    frequency: data.frequency ?? null,
    resolved: data.resolved,
    resolvedDate: data.resolved ? (data.resolvedDate ?? null) : null,
    notes: data.notes ?? null,
  };
}

export async function createRabbitDiseaseAction(
  rabbitId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = diseaseSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  await db.insert(rabbitDiseases).values({ rabbitId, ...values(parsed.data) });
  refresh(rabbitId);
  return { ok: true };
}

export async function updateRabbitDiseaseAction(
  rabbitId: number,
  diseaseId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = diseaseSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  await db
    .update(rabbitDiseases)
    .set(values(parsed.data))
    .where(and(eq(rabbitDiseases.id, diseaseId), eq(rabbitDiseases.rabbitId, rabbitId)));
  refresh(rabbitId);
  return { ok: true };
}

/** Borra y devuelve la fila para poder deshacer. */
export async function deleteRabbitDiseaseAction(
  rabbitId: number,
  diseaseId: number,
): Promise<ActionResult<RabbitDisease>> {
  const [row] = await db
    .delete(rabbitDiseases)
    .where(and(eq(rabbitDiseases.id, diseaseId), eq(rabbitDiseases.rabbitId, rabbitId)))
    .returning();
  refresh(rabbitId);
  return { ok: true, data: row };
}

/** Deshacer: reinserta la enfermedad borrada con los mismos datos e id. */
export async function restoreRabbitDiseaseAction(
  rabbitId: number,
  row: RabbitDisease,
): Promise<ActionResult> {
  await db
    .insert(rabbitDiseases)
    .values({
      id: row.id,
      rabbitId,
      startDate: row.startDate,
      name: row.name,
      treatment: row.treatment,
      medication: row.medication,
      dose: row.dose,
      frequency: row.frequency,
      resolved: row.resolved,
      resolvedDate: row.resolvedDate,
      notes: row.notes,
    })
    .onConflictDoNothing();
  refresh(rabbitId);
  return { ok: true };
}
