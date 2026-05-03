import { db } from "@/lib/db";
import { rabbits, animalStatusEnum } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Rabbit } from "@/db/schema";

export type RabbitStatus = (typeof animalStatusEnum.enumValues)[number];

export interface ListRabbitsFilters {
  search?: string;
  status?: RabbitStatus | "all";
}

export async function listRabbits(
  filters: ListRabbitsFilters = {},
): Promise<Rabbit[]> {
  const conds = [];
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conds.push(or(ilike(rabbits.tagId, term), ilike(rabbits.nickname, term))!);
  }
  if (filters.status && filters.status !== "all") {
    conds.push(eq(rabbits.status, filters.status));
  }

  return db
    .select()
    .from(rabbits)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(
      sql`case when ${rabbits.status} = 'activo' then 0 else 1 end`,
      asc(rabbits.tagId),
      desc(rabbits.createdAt),
    );
}

export async function getRabbitById(id: number): Promise<Rabbit | null> {
  const rows = await db
    .select()
    .from(rabbits)
    .where(eq(rabbits.id, id))
    .limit(1);
  return rows[0] ?? null;
}
