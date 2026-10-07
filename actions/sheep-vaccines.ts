"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheepVaccines, type SheepVaccine } from "@/db/schema";
import { vaccineSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function refresh(sheepId: number) {
  revalidatePath(`/ovejas/${sheepId}`);
  revalidatePath("/ovejas");
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
    type: parsed.data.type.trim(),
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
      type: parsed.data.type.trim(),
      dose: parsed.data.dose ?? null,
      nextDoseDate: parsed.data.nextDoseDate ?? null,
      vet: parsed.data.vet ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(and(eq(sheepVaccines.id, vaccineId), eq(sheepVaccines.sheepId, sheepId)));
  refresh(sheepId);
  return { ok: true };
}

/** Borra y devuelve la fila para poder deshacer. */
export async function deleteSheepVaccineAction(
  sheepId: number,
  vaccineId: number,
): Promise<ActionResult<SheepVaccine>> {
  const [row] = await db
    .delete(sheepVaccines)
    .where(and(eq(sheepVaccines.id, vaccineId), eq(sheepVaccines.sheepId, sheepId)))
    .returning();
  refresh(sheepId);
  return { ok: true, data: row };
}

/** Deshacer: reinserta la vacuna borrada con los mismos datos e id. */
export async function restoreSheepVaccineAction(
  sheepId: number,
  row: SheepVaccine,
): Promise<ActionResult> {
  await db
    .insert(sheepVaccines)
    .values({
      id: row.id,
      sheepId,
      date: row.date,
      type: row.type,
      dose: row.dose,
      nextDoseDate: row.nextDoseDate,
      vet: row.vet,
      notes: row.notes,
    })
    .onConflictDoNothing();
  refresh(sheepId);
  return { ok: true };
}
