"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions } from "@/db/schema";
import {
  transactionSchema,
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
  const parsed = transactionSchema.safeParse(fdObject(formData));
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
  const parsed = transactionSchema.safeParse(fdObject(formData));
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

export async function deleteTransactionAction(
  id: number,
): Promise<ActionResult> {
  // Recuperamos el vínculo antes de borrar para revalidar la ficha del animal
  const [row] = await db
    .select({ sheepId: transactions.sheepId, rabbitId: transactions.rabbitId })
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1);
  await db.delete(transactions).where(eq(transactions.id, id));
  refresh({ sheepId: row?.sheepId ?? null, rabbitId: row?.rabbitId ?? null });
  return { ok: true };
}
