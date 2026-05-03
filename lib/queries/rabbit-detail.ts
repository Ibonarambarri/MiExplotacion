import { db } from "@/lib/db";
import {
  rabbitVaccines,
  rabbitDiseases,
  rabbitBreedings,
  litters,
  transactions,
} from "@/db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import type {
  RabbitVaccine,
  RabbitDisease,
  RabbitBreeding,
  Litter,
  Transaction,
} from "@/db/schema";

export async function listRabbitVaccines(
  rabbitId: number,
): Promise<RabbitVaccine[]> {
  return db
    .select()
    .from(rabbitVaccines)
    .where(eq(rabbitVaccines.rabbitId, rabbitId))
    .orderBy(desc(rabbitVaccines.date));
}

export async function listRabbitDiseases(
  rabbitId: number,
): Promise<RabbitDisease[]> {
  return db
    .select()
    .from(rabbitDiseases)
    .where(eq(rabbitDiseases.rabbitId, rabbitId))
    .orderBy(asc(rabbitDiseases.resolved), desc(rabbitDiseases.startDate));
}

export interface BreedingWithLitter extends RabbitBreeding {
  litter: Litter | null;
}

export async function listRabbitBreedings(
  rabbitId: number,
): Promise<BreedingWithLitter[]> {
  const breedings = await db
    .select()
    .from(rabbitBreedings)
    .where(eq(rabbitBreedings.rabbitId, rabbitId))
    .orderBy(desc(rabbitBreedings.inseminationDate));

  if (breedings.length === 0) return [];

  const ids = breedings.map((b) => b.id);
  const allLitters = await db
    .select()
    .from(litters)
    .where(inArray(litters.breedingId, ids));

  const map = new Map<number, Litter>();
  for (const l of allLitters) {
    // sólo una camada por crianza; si hubiese varias, nos quedamos con la primera
    if (!map.has(l.breedingId)) map.set(l.breedingId, l);
  }

  return breedings.map((b) => ({ ...b, litter: map.get(b.id) ?? null }));
}

export async function getRabbitBreeding(
  breedingId: number,
): Promise<BreedingWithLitter | null> {
  const [breeding] = await db
    .select()
    .from(rabbitBreedings)
    .where(eq(rabbitBreedings.id, breedingId))
    .limit(1);
  if (!breeding) return null;

  const [litter] = await db
    .select()
    .from(litters)
    .where(eq(litters.breedingId, breedingId))
    .limit(1);

  return { ...breeding, litter: litter ?? null };
}

export async function listRabbitTransactions(
  rabbitId: number,
): Promise<Transaction[]> {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.rabbitId, rabbitId))
    .orderBy(desc(transactions.date));
}
