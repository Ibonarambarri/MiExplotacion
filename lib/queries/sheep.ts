import { db } from "@/lib/db";
import { sheep, animalStatusEnum } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import type { Sheep } from "@/db/schema";

export type SheepStatus = (typeof animalStatusEnum.enumValues)[number];

export interface ListSheepFilters {
  search?: string;
  status?: SheepStatus | "all";
}

/** Fila ligera para listados: nunca incluye la foto grande. */
export interface AnimalListItem {
  id: number;
  tagId: string;
  nickname: string | null;
  birthDate: string | null;
  status: SheepStatus;
  photoThumb: string | null;
}

const listColumns = {
  id: sheep.id,
  tagId: sheep.tagId,
  nickname: sheep.nickname,
  birthDate: sheep.birthDate,
  status: sheep.status,
  photoThumb: sheep.photoThumb,
};

export async function listSheep(
  filters: ListSheepFilters = {},
): Promise<AnimalListItem[]> {
  const conds = [];
  if (filters.search && filters.search.trim()) {
    const term = `%${filters.search.trim()}%`;
    conds.push(or(ilike(sheep.tagId, term), ilike(sheep.nickname, term))!);
  }
  if (filters.status && filters.status !== "all") {
    conds.push(eq(sheep.status, filters.status));
  }

  return db
    .select(listColumns)
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

/** Hijas registradas en el rebaño (genealogía). */
export async function listSheepDaughters(motherId: number): Promise<AnimalListItem[]> {
  return db
    .select(listColumns)
    .from(sheep)
    .where(eq(sheep.motherId, motherId))
    .orderBy(asc(sheep.birthDate), asc(sheep.tagId));
}

/** Nombre corto de un animal (apodo o crotal) sin cargar la foto. */
export async function getSheepLabel(
  id: number,
): Promise<{ id: number; label: string } | null> {
  const [r] = await db
    .select({ id: sheep.id, tagId: sheep.tagId, nickname: sheep.nickname })
    .from(sheep)
    .where(eq(sheep.id, id))
    .limit(1);
  return r ? { id: r.id, label: r.nickname || r.tagId } : null;
}
