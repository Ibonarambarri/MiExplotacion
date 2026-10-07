"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema";
import {
  transactionSchema,
  animalKind as animalKindSchema,
  transactionCategory,
  transactionType,
  fdObject,
  flattenZodError,
  type TransactionInput,
} from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

function normalize(input: TransactionInput) {
  // Sólo se mantiene un vínculo (sheepId o rabbitId), nunca ambos.
  let sheepId = input.sheepId ?? null;
  let rabbitId = input.rabbitId ?? null;
  let animalKind = input.animalKind ?? null;

  if (animalKind === "oveja") {
    rabbitId = null;
  } else if (animalKind === "coneja") {
    sheepId = null;
  } else {
    sheepId = null;
    rabbitId = null;
  }

  if (animalKind === "oveja" && !sheepId) animalKind = null;
  if (animalKind === "coneja" && !rabbitId) animalKind = null;

  return {
    date: input.date,
    type: input.type,
    category: input.category,
    amountEur: input.amountEur,
    description: input.description ?? null,
    animalKind,
    sheepId,
    rabbitId,
  };
}

/** Lee el FormData aceptando coma decimal en el importe ("12,5" → "12.5"). */
function readForm(formData: FormData) {
  const obj = fdObject(formData);
  if (typeof obj.amountEur === "string") {
    obj.amountEur = obj.amountEur.trim().replace(/\s/g, "").replace(",", ".");
  }
  if (obj.animalKind === "") delete obj.animalKind;
  return transactionSchema.safeParse(obj);
}

function refresh(extra?: { sheepId?: number | null; rabbitId?: number | null }) {
  revalidatePath("/finanzas");
  revalidatePath("/");
  if (extra?.sheepId) revalidatePath(`/ovejas/${extra.sheepId}`);
  if (extra?.rabbitId) revalidatePath(`/conejas/${extra.rabbitId}`);
}

export async function createTransactionAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const parsed = readForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const values = normalize(parsed.data);
  await db.insert(transactions).values(values);
  refresh({ sheepId: values.sheepId, rabbitId: values.rabbitId });
  redirect("/finanzas");
}

export async function updateTransactionAction(
  id: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = readForm(formData);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const values = normalize(parsed.data);
  await db.update(transactions).set(values).where(eq(transactions.id, id));
  refresh({ sheepId: values.sheepId, rabbitId: values.rabbitId });
  redirect("/finanzas");
}

const nullableId = z.number().int().positive().nullable();

/** Copia de un movimiento borrado, suficiente para reinsertarlo tal cual. */
const snapshotSchema = z.object({
  id: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: transactionType,
  category: transactionCategory,
  amountEur: z.string().regex(/^\d+(\.\d{1,2})?$/),
  description: z.string().max(1000).nullable(),
  animalKind: animalKindSchema.nullable(),
  sheepId: nullableId,
  rabbitId: nullableId,
  lambId: nullableId,
  litterId: nullableId,
});

export type TransactionSnapshot = z.infer<typeof snapshotSchema>;

export async function deleteTransactionAction(
  id: number,
): Promise<ActionResult<TransactionSnapshot>> {
  const [row] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  if (!row) return { ok: false, error: "El movimiento ya no existe." };

  await db.delete(transactions).where(eq(transactions.id, id));
  refresh({ sheepId: row.sheepId, rabbitId: row.rabbitId });

  return {
    ok: true,
    data: {
      id: row.id,
      date: row.date,
      type: row.type,
      category: row.category,
      amountEur: row.amountEur,
      description: row.description,
      animalKind: row.animalKind,
      sheepId: row.sheepId,
      rabbitId: row.rabbitId,
      lambId: row.lambId,
      litterId: row.litterId,
    },
  };
}

/**
 * Deshace un borrado: vuelve a insertar el movimiento con los mismos campos
 * (y el mismo id si sigue libre, para que los enlaces no cambien).
 */
export async function restoreTransactionAction(
  snapshot: TransactionSnapshot,
): Promise<ActionResult<{ id: number }>> {
  const parsed = snapshotSchema.safeParse(snapshot);
  if (!parsed.success) {
    return { ok: false, error: "No se pudo restaurar el movimiento." };
  }
  const { id, ...values } = parsed.data;

  const [existing] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);

  let newId: number;
  try {
    const [inserted] = await db
      .insert(transactions)
      .values(existing ? values : { id, ...values })
      .returning({ id: transactions.id });
    newId = inserted.id;
  } catch {
    // Un animal vinculado pudo borrarse entretanto: restaura sin vínculos de origen.
    try {
      const [inserted] = await db
        .insert(transactions)
        .values({
          ...values,
          sheepId: null,
          rabbitId: null,
          animalKind: null,
          lambId: null,
          litterId: null,
        })
        .returning({ id: transactions.id });
      newId = inserted.id;
    } catch {
      return { ok: false, error: "No se pudo restaurar el movimiento." };
    }
  }

  refresh({ sheepId: values.sheepId, rabbitId: values.rabbitId });
  return { ok: true, data: { id: newId } };
}
