"use server";

import { revalidatePath } from "next/cache";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { rabbits, rabbitBreedings, litters, transactions } from "@/db/schema";
import {
  rabbitBreedingSchema,
  litterSchema,
  litterSlaughterSchema,
  fdObject,
  flattenZodError,
} from "@/lib/validations";
import { addDaysIso } from "@/lib/dates";
import { getGestationDays } from "@/lib/settings";
import { syncLitterSale, type SaleSync } from "@/actions/sheep-sales";
import type { ActionResult } from "@/actions/sheep";

function refresh(rabbitId: number, breedingId?: number) {
  revalidatePath(`/conejas/${rabbitId}`);
  if (breedingId) {
    revalidatePath(`/conejas/${rabbitId}/crianzas/${breedingId}`);
  }
  revalidatePath("/conejas");
  revalidatePath("/");
}

async function motherLabel(rabbitId: number): Promise<string> {
  const [m] = await db
    .select({ tagId: rabbits.tagId, nickname: rabbits.nickname })
    .from(rabbits)
    .where(eq(rabbits.id, rabbitId))
    .limit(1);
  if (!m) return "coneja";
  return m.nickname ? `${m.nickname} (${m.tagId})` : m.tagId;
}

// ─── Breeding ─────────────────────────────────────────────────────────────
export async function createRabbitBreedingAction(
  rabbitId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const parsed = rabbitBreedingSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const expected =
    parsed.data.expectedBirthDate ??
    addDaysIso(parsed.data.inseminationDate, await getGestationDays("coneja"));

  const [row] = await db
    .insert(rabbitBreedings)
    .values({
      rabbitId,
      inseminationDate: parsed.data.inseminationDate,
      expectedBirthDate: expected,
      actualBirthDate: parsed.data.actualBirthDate ?? null,
      sire: parsed.data.sire ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning({ id: rabbitBreedings.id });

  refresh(rabbitId, row.id);
  return { ok: true, data: { id: row.id } };
}

export async function updateRabbitBreedingAction(
  rabbitId: number,
  breedingId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = rabbitBreedingSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const expected =
    parsed.data.expectedBirthDate ??
    addDaysIso(parsed.data.inseminationDate, await getGestationDays("coneja"));

  await db
    .update(rabbitBreedings)
    .set({
      inseminationDate: parsed.data.inseminationDate,
      expectedBirthDate: expected,
      actualBirthDate: parsed.data.actualBirthDate ?? null,
      sire: parsed.data.sire ?? null,
      notes: parsed.data.notes ?? null,
    })
    .where(
      and(eq(rabbitBreedings.id, breedingId), eq(rabbitBreedings.rabbitId, rabbitId)),
    );

  refresh(rabbitId, breedingId);
  return { ok: true };
}

/** Borra la crianza (y su camada). Siempre tras confirmación en la UI. */
export async function deleteRabbitBreedingAction(
  rabbitId: number,
  breedingId: number,
): Promise<ActionResult> {
  await db
    .delete(rabbitBreedings)
    .where(
      and(eq(rabbitBreedings.id, breedingId), eq(rabbitBreedings.rabbitId, rabbitId)),
    );
  refresh(rabbitId);
  return { ok: true };
}

// ─── Litter ───────────────────────────────────────────────────────────────
export async function createLitterAction(
  rabbitId: number,
  breedingId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ sale: SaleSync }>> {
  const parsed = litterSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const initial = parsed.data.initialUnits ?? 0;
  const current = parsed.data.currentUnits ?? initial;
  const label = await motherLabel(rabbitId);

  const sale = await db.transaction(async (tx) => {
    const [litter] = await tx
      .insert(litters)
      .values({
        breedingId,
        initialUnits: initial,
        currentUnits: current,
        naturalDeaths: parsed.data.naturalDeaths ?? 0,
        averageWeightKg: parsed.data.averageWeightKg ?? null,
        slaughterDate: parsed.data.slaughterDate ?? null,
        slaughteredUnits: parsed.data.slaughteredUnits ?? null,
        saleAmountEur: parsed.data.saleAmountEur ?? null,
        notes: parsed.data.notes ?? null,
      })
      .returning();
    return syncLitterSale(tx, { litter, prev: null, rabbitId, motherLabel: label });
  });

  refresh(rabbitId, breedingId);
  if (sale) revalidatePath("/finanzas");
  return { ok: true, data: { sale } };
}

export async function updateLitterAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ sale: SaleSync }>> {
  const parsed = litterSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const label = await motherLabel(rabbitId);

  const sale = await db.transaction(async (tx) => {
    const [prev] = await tx
      .select()
      .from(litters)
      .where(and(eq(litters.id, litterId), eq(litters.breedingId, breedingId)))
      .limit(1);
    if (!prev) return null;
    const [litter] = await tx
      .update(litters)
      .set({
        initialUnits: parsed.data.initialUnits ?? 0,
        currentUnits: parsed.data.currentUnits ?? 0,
        naturalDeaths: parsed.data.naturalDeaths ?? 0,
        averageWeightKg: parsed.data.averageWeightKg ?? null,
        slaughterDate: parsed.data.slaughterDate ?? null,
        slaughteredUnits: parsed.data.slaughteredUnits ?? null,
        saleAmountEur: parsed.data.saleAmountEur ?? null,
        notes: parsed.data.notes ?? null,
      })
      .where(eq(litters.id, litterId))
      .returning();
    return syncLitterSale(tx, { litter, prev, rabbitId, motherLabel: label });
  });

  refresh(rabbitId, breedingId);
  if (sale) revalidatePath("/finanzas");
  return { ok: true, data: { sale } };
}

/**
 * Borra la camada (tras confirmación). Su ingreso automático (litterId)
 * también se quita para no dejar ventas huérfanas en Finanzas.
 */
export async function deleteLitterAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
): Promise<ActionResult> {
  const removed = await db.transaction(async (tx) => {
    const [l] = await tx
      .select({ id: litters.id })
      .from(litters)
      .where(and(eq(litters.id, litterId), eq(litters.breedingId, breedingId)))
      .limit(1);
    if (!l) return 0;
    const txs = await tx
      .delete(transactions)
      .where(eq(transactions.litterId, litterId))
      .returning({ id: transactions.id });
    await tx.delete(litters).where(eq(litters.id, litterId));
    return txs.length;
  });
  refresh(rabbitId, breedingId);
  if (removed) revalidatePath("/finanzas");
  return { ok: true };
}

/**
 * Acción rápida: registrar muerte natural de un gazapo.
 * Incrementa naturalDeaths y reduce currentUnits en 1 (sin bajar de 0).
 */
export async function recordLitterDeathAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
): Promise<ActionResult> {
  await db
    .update(litters)
    .set({
      naturalDeaths: sql`${litters.naturalDeaths} + 1`,
      currentUnits: sql`GREATEST(${litters.currentUnits} - 1, 0)`,
    })
    .where(and(eq(litters.id, litterId), eq(litters.breedingId, breedingId)));

  refresh(rabbitId, breedingId);
  return { ok: true };
}

/** Deshacer la muerte natural registrada por error. */
export async function undoLitterDeathAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
): Promise<ActionResult> {
  await db
    .update(litters)
    .set({
      naturalDeaths: sql`GREATEST(${litters.naturalDeaths} - 1, 0)`,
      currentUnits: sql`${litters.currentUnits} + 1`,
    })
    .where(and(eq(litters.id, litterId), eq(litters.breedingId, breedingId)));
  refresh(rabbitId, breedingId);
  return { ok: true };
}

/**
 * Acción rápida: registrar matanza (fecha, unidades y, opcionalmente, el
 * importe de la venta, que crea/actualiza un ingreso en Finanzas).
 */
export async function recordLitterSlaughterAction(
  rabbitId: number,
  breedingId: number,
  litterId: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ sale: SaleSync }>> {
  const parsed = litterSlaughterSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const { slaughterDate, saleAmountEur } = parsed.data;
  const units = parsed.data.slaughteredUnits ?? null;
  const label = await motherLabel(rabbitId);

  const sale = await db.transaction(async (tx) => {
    const [prev] = await tx
      .select()
      .from(litters)
      .where(and(eq(litters.id, litterId), eq(litters.breedingId, breedingId)))
      .limit(1);
    if (!prev) return null;
    const [litter] = await tx
      .update(litters)
      .set({
        slaughterDate,
        slaughteredUnits: units,
        saleAmountEur: saleAmountEur ?? prev.saleAmountEur,
        currentUnits:
          units !== null ? sql`GREATEST(${litters.currentUnits} - ${units}, 0)` : 0,
      })
      .where(eq(litters.id, litterId))
      .returning();
    return syncLitterSale(tx, { litter, prev, rabbitId, motherLabel: label });
  });

  refresh(rabbitId, breedingId);
  if (sale) revalidatePath("/finanzas");
  return { ok: true, data: { sale } };
}
