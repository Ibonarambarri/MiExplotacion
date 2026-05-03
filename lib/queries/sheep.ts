import { db } from "@/lib/db";
import { sheep, animalStatusEnum } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Sheep } from "@/db/schema";

export type SheepStatus = (typeof animalStatusEnum.enumValues)[number];

export interface ListSheepFilters {
  search?: string;
  status?: SheepStatus | "all";
}

export async function listSheep(
  filters: ListSheepFilters = {},
): Promise<Sheep[]> {
  const conds = [];
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conds.push(or(ilike(sheep.tagId, term), ilike(sheep.nickname, term))!);
  }
  if (filters.status && filters.status !== "all") {
    conds.push(eq(sheep.status, filters.status));
  }

  return db
    .select()
    .from(sheep)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(
      // Activos primero, luego el resto
      sql`case when ${sheep.status} = 'activo' then 0 else 1 end`,
      asc(sheep.tagId),
      desc(sheep.createdAt),
    );
}

export async function getSheepById(id: number): Promise<Sheep | null> {
  const rows = await db.select().from(sheep).where(eq(sheep.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function countActiveSheep(): Promise<number> {
  const rows = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(sheep)
    .where(eq(sheep.status, "activo"));
  return rows[0]?.c ?? 0;
}
