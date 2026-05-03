"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheepVaccines } from "@/db/schema";
import { vaccineSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function refresh(sheepId: number) {
  revalidatePath(`/ovejas/${sheepId}`);
  revalidatePath("/");
}

export async function createSheepVaccineAction(
  sheepId: number,
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
  await db.insert(sheepVaccines).values({
    sheepId,
    date: parsed.data.date,
    type: parsed.data.type,
    dose: parsed.data.dose ?? null,
    nextDoseDate: parsed.data.nextDoseDate ?? null,
    vet: parsed.data.vet ?? null,
    notes: parsed.data.notes ?? null,
  });
  refresh(sheepId);
  return { ok: true };
}

export async function updateSheepVaccineAction(
  sheepId: number,
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
    .update(sheepVaccines)
    .set({
      date: parsed.data.date,
      type: parsed.data.type,
      dose: parsed.data.dose ?? null,
      nextDoseDate: parsed.data.nextDoseDate ?? null,
      vet: parsed.data.vet ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(eq(sheepVaccines.id, vaccineId));
  refresh(sheepId);
  return { ok: true };
}

export async function deleteSheepVaccineAction(
  sheepId: number,
  vaccineId: number,
): Promise<ActionResult> {
  await db.delete(sheepVaccines).where(eq(sheepVaccines.id, vaccineId));
  refresh(sheepId);
  return { ok: true };
}
