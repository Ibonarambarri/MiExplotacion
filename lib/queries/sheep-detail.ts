import { db } from "@/lib/db";
import {
  sheepVaccines,
  sheepDiseases,
  sheepBreedings,
  lambs,
  transactions,
} from "@/db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import type {
  SheepVaccine,
  SheepDisease,
  SheepBreeding,
  Lamb,
  Transaction,
} from "@/db/schema";

export async function listSheepVaccines(
  sheepId: number,
): Promise<SheepVaccine[]> {
  return db
    .select()
    .from(sheepVaccines)
    .where(eq(sheepVaccines.sheepId, sheepId))
    .orderBy(desc(sheepVaccines.date));
}

export async function listSheepDiseases(
  sheepId: number,
): Promise<SheepDisease[]> {
  return db
    .select()
    .from(sheepDiseases)
    .where(eq(sheepDiseases.sheepId, sheepId))
    .orderBy(asc(sheepDiseases.resolved), desc(sheepDiseases.startDate));
}

export interface BreedingWithLambs extends SheepBreeding {
  lambs: Lamb[];
}

export async function listSheepBreedings(
  sheepId: number,
): Promise<BreedingWithLambs[]> {
  const breedings = await db
    .select()
    .from(sheepBreedings)
    .where(eq(sheepBreedings.sheepId, sheepId))
    .orderBy(desc(sheepBreedings.inseminationDate));

  if (breedings.length === 0) return [];

  const ids = breedings.map((b) => b.id);
  const allLambs = await db
    .select()
    .from(lambs)
    .where(inArray(lambs.breedingId, ids))
    .orderBy(asc(lambs.id));

  const grouped: Record<number, Lamb[]> = {};
  for (const l of allLambs) {
    (grouped[l.breedingId] ??= []).push(l);
  }

  return breedings.map((b) => ({ ...b, lambs: grouped[b.id] ?? [] }));
}

export async function getSheepBreeding(
  breedingId: number,
): Promise<BreedingWithLambs | null> {
  const [breeding] = await db
    .select()
    .from(sheepBreedings)
    .where(eq(sheepBreedings.id, breedingId))
    .limit(1);
  if (!breeding) return null;

  const breedingLambs = await db
    .select()
    .from(lambs)
    .where(eq(lambs.breedingId, breedingId))
    .orderBy(asc(lambs.id));

  return { ...breeding, lambs: breedingLambs };
}

export async function listSheepTransactions(
  sheepId: number,
): Promise<Transaction[]> {
  return db
    .select()
    .from(transactions)
    .where(eq(transactions.sheepId, sheepId))
    .orderBy(desc(transactions.date));
}
