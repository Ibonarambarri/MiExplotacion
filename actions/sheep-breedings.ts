"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  sheep,
  sheepBreedings,
  lambs,
  transactions,
  weightRecords,
  type Lamb,
  type Transaction,
  type WeightRecord,
} from "@/db/schema";
import {
  sheepBreedingSchema,
  lambSchema,
  promoteLambSchema,
  fdObject,
  flattenZodError,
} from "@/lib/validations";
import { addDaysIso } from "@/lib/dates";
import { getGestationDays } from "@/lib/settings";
import { syncLambSale, type SaleSync } from "@/actions/sheep-sales";
import type { ActionResult } from "@/actions/sheep";

function refresh(sheepId: number, breedingId?: number) {
  revalidatePath(`/ovejas/${sheepId}`);
  if (breedingId) {
    revalidatePath(`/ovejas/${sheepId}/crianzas/${breedingId}`);
  }
  revalidatePath("/ovejas");
  revalidatePath("/");
}

async function motherLabel(sheepId: number): Promise<string> {
  const [m] = await db
    .select({ tagId: sheep.tagId, nickname: sheep.nickname })
    .from(sheep)
    .where(eq(sheep.id, sheepId))
    .limit(1);
  if (!m) return "oveja";
  return m.nickname ? `${m.nickname} (${m.tagId})` : m.tagId;
}

// ─── Breeding ─────────────────────────────────────────────────────────────
export async function createSheepBreedingAction(
  sheepId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const parsed = sheepBreedingSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const expected =
    parsed.data.expectedBirthDate ??
    addDaysIso(parsed.data.inseminationDate, await getGestationDays("oveja"));

  const [row] = await db
    .insert(sheepBreedings)
    .values({
      sheepId,
      inseminationDate: parsed.data.inseminationDate,
      expectedBirthDate: expected,
      actualBirthDate: parsed.data.actualBirthDate ?? null,
      sire: parsed.data.sire ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: sheepBreedings.id });

  refresh(sheepId, row.id);
  return { ok: true, data: { id: row.id } };
}

export async function updateSheepBreedingAction(
  sheepId: number,
  breedingId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = sheepBreedingSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const expected =
    parsed.data.expectedBirthDate ??
    addDaysIso(parsed.data.inseminationDate, await getGestationDays("oveja"));

  await db
    .update(sheepBreedings)
    .set({
      inseminationDate: parsed.data.inseminationDate,
      expectedBirthDate: expected,
      actualBirthDate: parsed.data.actualBirthDate ?? null,
      sire: parsed.data.sire ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(
      and(eq(sheepBreedings.id, breedingId), eq(sheepBreedings.sheepId, sheepId)),
    );

  refresh(sheepId, breedingId);
  return { ok: true };
}

/** Borra la crianza (y sus corderos). Siempre tras confirmación en la UI. */
export async function deleteSheepBreedingAction(
  sheepId: number,
  breedingId: number,
): Promise<ActionResult> {
  await db
    .delete(sheepBreedings)
    .where(
      and(eq(sheepBreedings.id, breedingId), eq(sheepBreedings.sheepId, sheepId)),
    );
  refresh(sheepId);
  return { ok: true };
}

// ─── Lambs ────────────────────────────────────────────────────────────────
function lambValues(data: ReturnType<typeof lambSchema.parse>) {
  return {
    gender: data.gender ?? null,
    nickname: data.nickname ?? null,
    status: data.status,
    slaughterDate:
      data.status === "sacrificado" || data.status === "muerto_natural"
        ? (data.slaughterDate ?? null)
        : null,
    deadWeightKg: data.status === "sacrificado" ? (data.deadWeightKg ?? null) : null,
    saleDate: data.status === "vendido" ? (data.saleDate ?? null) : null,
    salePriceEur: data.status === "vendido" ? (data.salePriceEur ?? null) : null,
    notes: data.notes ?? null,
  };
}

export async function createLambAction(
  sheepId: number,
  breedingId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ sale: SaleSync }>> {
  const parsed = lambSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const label = await motherLabel(sheepId);
  const sale = await db.transaction(async (tx) => {
    const [lamb] = await tx
      .insert(lambs)
      .values({ breedingId, ...lambValues(parsed.data) })
      .returning();
    return syncLambSale(tx, { lamb, prev: null, sheepId, motherLabel: label });
  });
  refresh(sheepId, breedingId);
  if (sale) revalidatePath("/finanzas");
  return { ok: true, data: { sale } };
}

export async function updateLambAction(
  sheepId: number,
  breedingId: number,
  lambId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ sale: SaleSync }>> {
  const parsed = lambSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const label = await motherLabel(sheepId);
  const sale = await db.transaction(async (tx) => {
    const [prev] = await tx
      .select()
      .from(lambs)
      .where(and(eq(lambs.id, lambId), eq(lambs.breedingId, breedingId)))
      .limit(1);
    if (!prev) return null;
    const [lamb] = await tx
      .update(lambs)
      .set(lambValues(parsed.data))
      .where(eq(lambs.id, lambId))
      .returning();
    return syncLambSale(tx, { lamb, prev, sheepId, motherLabel: label });
  });
  refresh(sheepId, breedingId);
  if (sale) revalidatePath("/finanzas");
  return { ok: true, data: { sale } };
}

/** Lo necesario para deshacer el borrado de un cordero. */
export interface LambSnapshot {
  lamb: Lamb;
  transactions: Transaction[];
  weights: WeightRecord[];
}

/**
 * Borra un cordero. Su ingreso automático (lambId) también se quita para no
 * dejar ventas huérfanas en Finanzas; se devuelve todo para poder deshacer.
 */
export async function deleteLambAction(
  sheepId: number,
  breedingId: number,
  lambId: number,
): Promise<ActionResult<LambSnapshot>> {
  const snapshot = await db.transaction(async (tx) => {
    const [lamb] = await tx
      .select()
      .from(lambs)
      .where(and(eq(lambs.id, lambId), eq(lambs.breedingId, breedingId)))
      .limit(1);
    if (!lamb) return null;
    const txs = await tx.select().from(transactions).where(eq(transactions.lambId, lambId));
    const ws = await tx.select().from(weightRecords).where(eq(weightRecords.lambId, lambId));
    await tx.delete(transactions).where(eq(transactions.lambId, lambId));
    await tx.delete(lambs).where(eq(lambs.id, lambId));
    return { lamb, transactions: txs, weights: ws };
  });
  if (!snapshot) return { ok: false, error: "El cordero ya no existe." };
  refresh(sheepId, breedingId);
  if (snapshot.transactions.length) revalidatePath("/finanzas");
  return { ok: true, data: snapshot };
}

export async function restoreLambAction(
  sheepId: number,
  breedingId: number,
  snap: LambSnapshot,
): Promise<ActionResult> {
  const l = snap.lamb;
  await db.transaction(async (tx) => {
    await tx
      .insert(lambs)
      .values({
        id: l.id,
        breedingId,
        gender: l.gender,
        nickname: l.nickname,
        status: l.status,
        slaughterDate: l.slaughterDate,
        deadWeightKg: l.deadWeightKg,
        saleDate: l.saleDate,
        salePriceEur: l.salePriceEur,
        promotedSheepId: l.promotedSheepId,
        notes: l.notes,
      })
      .onConflictDoNothing();
    for (const t of snap.transactions) {
      await tx
        .insert(transactions)
        .values({
          id: t.id,
          date: t.date,
          type: t.type,
          category: t.category,
          amountEur: t.amountEur,
          description: t.description,
          animalKind: t.animalKind,
          sheepId: t.sheepId,
          rabbitId: t.rabbitId,
          lambId: l.id,
          litterId: t.litterId,
        })
        .onConflictDoNothing();
    }
    for (const w of snap.weights) {
      await tx
        .insert(weightRecords)
        .values({ id: w.id, date: w.date, weightKg: w.weightKg, lambId: l.id, notes: w.notes })
        .onConflictDoNothing();
    }
  });
  refresh(sheepId, breedingId);
  if (snap.transactions.length) revalidatePath("/finanzas");
  return { ok: true };
}

// ─── Genealogía: pasar cordera al rebaño ──────────────────────────────────
export async function promoteLambAction(
  sheepId: number,
  breedingId: number,
  lambId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const parsed = promoteLambSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const [row] = await db
    .select({ lamb: lambs, breeding: sheepBreedings })
    .from(lambs)
    .innerJoin(sheepBreedings, eq(sheepBreedings.id, lambs.breedingId))
    .where(and(eq(lambs.id, lambId), eq(lambs.breedingId, breedingId)))
    .limit(1);
  if (!row || row.breeding.sheepId !== sheepId) {
    return { ok: false, error: "No se encontró la cordera." };
  }
  if (row.lamb.promotedSheepId) {
    return { ok: false, error: "Esta cordera ya está en el rebaño." };
  }
  if (row.lamb.gender !== "hembra" || row.lamb.status !== "vivo") {
    return { ok: false, error: "Solo se pueden pasar al rebaño corderas vivas." };
  }

  let newId: number;
  try {
    newId = await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(sheep)
        .values({
          tagId: parsed.data.tagId,
          nickname: parsed.data.nickname ?? row.lamb.nickname ?? null,
          birthDate: row.breeding.actualBirthDate,
          motherId: sheepId,
          status: "activo",
          notes: row.lamb.notes,
        })
        .returning({ id: sheep.id });
      await tx
        .update(lambs)
        .set({ promotedSheepId: created.id })
        .where(eq(lambs.id, lambId));
      return created.id;
    });
  } catch (e) {
    const code =
      (e as { code?: string }).code ?? (e as { cause?: { code?: string } }).cause?.code;
    if (code === "23505") {
      return {
        ok: false,
        error: "Ya existe una oveja con ese crotal.",
        fieldErrors: { tagId: "Crotal duplicado" },
      };
    }
    throw e;
  }
  refresh(sheepId, breedingId);
  return { ok: true, data: { id: newId } };
}
