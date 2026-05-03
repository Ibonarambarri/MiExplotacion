"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rabbitVaccines } from "@/db/schema";
import { vaccineSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function refresh(rabbitId: number) {
  revalidatePath(`/conejas/${rabbitId}`);
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
    type: parsed.data.type,
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
      type: parsed.data.type,
      dose: parsed.data.dose ?? null,
      nextDoseDate: parsed.data.nextDoseDate ?? null,
      vet: parsed.data.vet ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(rabbitVaccines.id, vaccineId));
  refresh(rabbitId);
  return { ok: true };
}

export async function deleteRabbitVaccineAction(
  rabbitId: number,
  vaccineId: number,
): Promise<ActionResult> {
  await db.delete(rabbitVaccines).where(eq(rabbitVaccines.id, vaccineId));
  refresh(rabbitId);
  return { ok: true };
}
