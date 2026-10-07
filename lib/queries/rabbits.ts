import { db } from "@/lib/db";
import { rabbits, animalStatusEnum } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Rabbit } from "@/db/schema";
import type { AnimalListItem } from "@/lib/queries/sheep";

export type { AnimalListItem } from "@/lib/queries/sheep";
export type RabbitStatus = (typeof animalStatusEnum.enumValues)[number];

export interface ListRabbitsFilters {
  search?: string;
  status?: RabbitStatus | "all";
}

/** Columnas ligeras para listados: nunca incluye la foto grande. */
const listColumns = {
  id: rabbits.id,
  tagId: rabbits.tagId,
  nickname: rabbits.nickname,
  birthDate: rabbits.birthDate,
  status: rabbits.status,
  photoThumb: rabbits.photoThumb,
};

export async function listRabbits(
  filters: ListRabbitsFilters = {},
): Promise<AnimalListItem[]> {
  const conds = [];
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conds.push(or(ilike(rabbits.tagId, term), ilike(rabbits.nickname, term))!);
  }
  if (filters.status && filters.status !== "all") {
    conds.push(eq(rabbits.status, filters.status));
  }

  return db
    .select(listColumns)
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

/** Hijas registradas en la explotación (genealogía). */
export async function listRabbitDaughters(motherId: number): Promise<AnimalListItem[]> {
  return db
    .select(listColumns)
    .from(rabbits)
    .where(eq(rabbits.motherId, motherId))
    .orderBy(asc(rabbits.birthDate), asc(rabbits.tagId));
}

export async function getRabbitLabel(
  id: number,
): Promise<{ id: number; label: string } | null> {
  const [r] = await db
    .select({ id: rabbits.id, tagId: rabbits.tagId, nickname: rabbits.nickname })
    .from(rabbits)
    .where(eq(rabbits.id, id))
    .limit(1);
  return r ? { id: r.id, label: r.nickname || r.tagId } : null;
}
