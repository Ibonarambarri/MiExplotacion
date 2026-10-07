"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheepDiseases, type SheepDisease } from "@/db/schema";
import { diseaseSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function refresh(sheepId: number) {
  revalidatePath(`/ovejas/${sheepId}`);
  revalidatePath("/ovejas");
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

export async function createSheepDiseaseAction(
  sheepId: number,
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
  await db.insert(sheepDiseases).values({ sheepId, ...values(parsed.data) });
  refresh(sheepId);
  return { ok: true };
}

export async function updateSheepDiseaseAction(
  sheepId: number,
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
    .update(sheepDiseases)
    .set(values(parsed.data))
    .where(and(eq(sheepDiseases.id, diseaseId), eq(sheepDiseases.sheepId, sheepId)));
  refresh(sheepId);
  return { ok: true };
}

/** Borra y devuelve la fila para poder deshacer. */
export async function deleteSheepDiseaseAction(
  sheepId: number,
  diseaseId: number,
): Promise<ActionResult<SheepDisease>> {
  const [row] = await db
    .delete(sheepDiseases)
    .where(and(eq(sheepDiseases.id, diseaseId), eq(sheepDiseases.sheepId, sheepId)))
    .returning();
  refresh(sheepId);
  return { ok: true, data: row };
}

/** Deshacer: reinserta la enfermedad borrada con los mismos datos e id. */
export async function restoreSheepDiseaseAction(
  sheepId: number,
  row: SheepDisease,
): Promise<ActionResult> {
  await db
    .insert(sheepDiseases)
    .values({
      id: row.id,
      sheepId,
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
  refresh(sheepId);
  return { ok: true };
}
