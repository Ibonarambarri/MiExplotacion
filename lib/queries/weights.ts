import { db } from "@/lib/db";
import { weightRecords, type WeightRecord } from "@/db/schema";
import { asc, eq, inArray } from "drizzle-orm";

/** A quién pertenece un pesaje. */
export type WeightTargetKind = "sheep" | "rabbit" | "lamb" | "litter";
export interface WeightTarget {
  kind: WeightTargetKind;
  id: number;
}

/** Pesaje serializable para el cliente (kg como número). */
export interface WeightPoint {
  id: number;
  date: string;
  weightKg: number;
  notes: string | null;
}

export function toPoint(r: WeightRecord): WeightPoint {
  return { id: r.id, date: r.date, weightKg: Number(r.weightKg), notes: r.notes };
}

export function targetColumn(kind: WeightTargetKind) {
  switch (kind) {
    case "sheep":
      return weightRecords.sheepId;
    case "rabbit":
      return weightRecords.rabbitId;
    case "lamb":
      return weightRecords.lambId;
    case "litter":
      return weightRecords.litterId;
  }
}

/** Pesajes de un animal/cría en orden cronológico. */
export async function listWeights(target: WeightTarget): Promise<WeightPoint[]> {
  const rows = await db
    .select()
    .from(weightRecords)
    .where(eq(targetColumn(target.kind), target.id))
    .orderBy(asc(weightRecords.date), asc(weightRecords.id));
  return rows.map(toPoint);
}

/** Pesajes de varios corderos de una vez (sin N+1), agrupados por cordero. */
export async function listLambWeights(
  lambIds: number[],
): Promise<Record<number, WeightPoint[]>> {
  if (lambIds.length === 0) return {};
  const rows = await db
    .select()
    .from(weightRecords)
    .where(inArray(weightRecords.lambId, lambIds))
    .orderBy(asc(weightRecords.date), asc(weightRecords.id));
  const out: Record<number, WeightPoint[]> = {};
  for (const r of rows) (out[r.lambId!] ??= []).push(toPoint(r));
  return out;
}
