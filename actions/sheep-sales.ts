import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { transactions, type Lamb, type Litter } from "@/db/schema";
import { todayIso } from "@/lib/dates";

/**
 * Ventas automáticas: al vender un cordero (o registrar la venta de una
 * matanza de camada) se crea/actualiza un ingreso en Finanzas enlazado por
 * lambId/litterId. Solo se toca el movimiento con ese id de origen.
 *
 * (No es un archivo "use server": son utilidades internas de las acciones.)
 */

type Executor = Pick<typeof db, "select" | "insert" | "update" | "delete">;
export type SaleSync = "created" | "updated" | "removed" | null;

const same = (a: string | null | undefined, b: string | null | undefined) =>
  (a ? Number(a) : null) === (b ? Number(b) : null);

export async function syncLambSale(
  ex: Executor,
  args: {
    lamb: Lamb;
    prev: Lamb | null;
    sheepId: number;
    motherLabel: string;
  },
): Promise<SaleSync> {
  const { lamb, prev, sheepId, motherLabel } = args;
  const price = lamb.salePriceEur ? Number(lamb.salePriceEur) : 0;
  const sold = lamb.status === "vendido" && price > 0;
  const [existing] = await ex
    .select()
    .from(transactions)
    .where(eq(transactions.lambId, lamb.id))
    .limit(1);

  if (sold) {
    const date = lamb.saleDate ?? todayIso();
    const description = `Venta cordero${lamb.nickname ? ` ${lamb.nickname}` : ""} de ${motherLabel}`;
    if (existing) {
      if (same(existing.amountEur, lamb.salePriceEur) && existing.date === date) return null;
      await ex
        .update(transactions)
        .set({ amountEur: lamb.salePriceEur!, date })
        .where(eq(transactions.id, existing.id));
      return "updated";
    }
    // Ventas anteriores a esta función: si la venta no ha cambiado no
    // creamos nada (puede que ya se apuntara a mano en Finanzas).
    if (
      prev &&
      prev.status === "vendido" &&
      same(prev.salePriceEur, lamb.salePriceEur) &&
      prev.saleDate === lamb.saleDate
    ) {
      return null;
    }
    await ex.insert(transactions).values({
      date,
      type: "ingreso",
      category: "venta_animal",
      amountEur: lamb.salePriceEur!,
      description,
      animalKind: "oveja",
      sheepId,
      lambId: lamb.id,
    });
    return "created";
  }

  if (existing) {
    await ex.delete(transactions).where(eq(transactions.lambId, lamb.id));
    return "removed";
  }
  return null;
}

export async function syncLitterSale(
  ex: Executor,
  args: {
    litter: Litter;
    prev: Litter | null;
    rabbitId: number;
    motherLabel: string;
  },
): Promise<SaleSync> {
  const { litter, prev, rabbitId, motherLabel } = args;
  const amount = litter.saleAmountEur ? Number(litter.saleAmountEur) : 0;
  const [existing] = await ex
    .select()
    .from(transactions)
    .where(eq(transactions.litterId, litter.id))
    .limit(1);

  if (amount > 0) {
    const date = litter.slaughterDate ?? todayIso();
    if (existing) {
      if (same(existing.amountEur, litter.saleAmountEur) && existing.date === date) return null;
      await ex
        .update(transactions)
        .set({ amountEur: litter.saleAmountEur!, date })
        .where(eq(transactions.id, existing.id));
      return "updated";
    }
    if (prev && same(prev.saleAmountEur, litter.saleAmountEur) && prev.slaughterDate === litter.slaughterDate) {
      return null;
    }
    await ex.insert(transactions).values({
      date,
      type: "ingreso",
      category: "venta_carne",
      amountEur: litter.saleAmountEur!,
      description: `Venta carne camada de ${motherLabel}`,
      animalKind: "coneja",
      rabbitId,
      litterId: litter.id,
    });
    return "created";
  }

  if (existing) {
    await ex.delete(transactions).where(eq(transactions.litterId, litter.id));
    return "removed";
  }
  return null;
}
