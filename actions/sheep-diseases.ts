"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheepDiseases } from "@/db/schema";
import { diseaseSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function refresh(sheepId: number) {
  revalidatePath(`/ovejas/${sheepId}`);
  revalidatePath("/");
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
  await db.insert(sheepDiseases).values({
    sheepId,
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
    .where(eq(sheepDiseases.id, diseaseId));
  refresh(sheepId);
  return { ok: true };
}

export async function deleteSheepDiseaseAction(
  sheepId: number,
  diseaseId: number,
): Promise<ActionResult> {
  await db.delete(sheepDiseases).where(eq(sheepDiseases.id, diseaseId));
  refresh(sheepId);
  return { ok: true };
}
