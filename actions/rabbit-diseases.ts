"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rabbitDiseases } from "@/db/schema";
import { diseaseSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function refresh(rabbitId: number) {
  revalidatePath(`/conejas/${rabbitId}`);
  revalidatePath("/");
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
  await db.insert(rabbitDiseases).values({
    rabbitId,
    startDate: parsed.data.startDate,
    name: parsed.data.name,
    treatment: parsed.data.treatment ?? null,
    medication: parsed.data.medication ?? null,
    dose: parsed.data.dose ?? null,
    frequency: parsed.data.frequency ?? null,
    resolved: parsed.data.resolved,
    resolvedDate: parsed.data.resolved
      ? (parsed.data.resolvedDate ?? null)
      : null,
    notes: parsed.data.notes ?? null,
  });
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
    .set({
      startDate: parsed.data.startDate,
      name: parsed.data.name,
      treatment: parsed.data.treatment ?? null,
      medication: parsed.data.medication ?? null,
      dose: parsed.data.dose ?? null,
      frequency: parsed.data.frequency ?? null,
      resolved: parsed.data.resolved,
      resolvedDate: parsed.data.resolved
        ? (parsed.data.resolvedDate ?? null)
        : null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(rabbitDiseases.id, diseaseId));
  refresh(rabbitId);
  return { ok: true };
}

export async function deleteRabbitDiseaseAction(
  rabbitId: number,
  diseaseId: number,
): Promise<ActionResult> {
  await db.delete(rabbitDiseases).where(eq(rabbitDiseases.id, diseaseId));
  refresh(rabbitId);
  return { ok: true };
}
