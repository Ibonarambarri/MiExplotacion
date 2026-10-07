"use server";

import { revalidatePath } from "next/cache";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheep, rabbits, sheepVaccines, rabbitVaccines } from "@/db/schema";
import { vaccineSchema, fdObject, flattenZodError } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

/**
 * Vacunación / desparasitación en lote: una vacuna por animal seleccionado,
 * todo en una sola transacción (o se guardan todas o ninguna).
 */
export async function batchVaccinateAction(
  kind: "oveja" | "coneja",
  animalIds: number[],
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ count: number }>> {
  const ids = [...new Set(animalIds)].filter((n) => Number.isInteger(n) && n > 0);
  if (ids.length === 0) return { ok: false, error: "Selecciona al menos un animal." };
  if (ids.length > 1000) return { ok: false, error: "Demasiados animales a la vez." };

  const parsed = vaccineSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const v = {
    date: parsed.data.date,
    type: parsed.data.type.trim(),
    dose: parsed.data.dose ?? null,
    nextDoseDate: parsed.data.nextDoseDate ?? null,
    vet: parsed.data.vet ?? null,
    notes: parsed.data.notes ?? null,
  };

  const count = await db.transaction(async (tx) => {
    if (kind === "oveja") {
      const found = await tx.select({ id: sheep.id }).from(sheep).where(inArray(sheep.id, ids));
      if (found.length === 0) return 0;
      await tx.insert(sheepVaccines).values(found.map((a) => ({ sheepId: a.id, ...v })));
      return found.length;
    }
    const found = await tx
      .select({ id: rabbits.id })
      .from(rabbits)
      .where(inArray(rabbits.id, ids));
    if (found.length === 0) return 0;
    await tx.insert(rabbitVaccines).values(found.map((a) => ({ rabbitId: a.id, ...v })));
    return found.length;
  });

  const base = kind === "oveja" ? "/ovejas" : "/conejas";
  revalidatePath(base);
  revalidatePath(`${base}/[id]`, "page");
  revalidatePath("/");
  return { ok: true, data: { count } };
}
