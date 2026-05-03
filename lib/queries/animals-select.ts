import { db } from "@/lib/db";
import { sheep, rabbits } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export interface AnimalOption {
  id: number;
  label: string;
}

export async function listSheepOptions(): Promise<AnimalOption[]> {
  const rows = await db
    .select({ id: sheep.id, tagId: sheep.tagId, nickname: sheep.nickname })
    .from(sheep)
    .where(eq(sheep.status, "activo"))
    .orderBy(asc(sheep.tagId));
  return rows.map((r) => ({
    id: r.id,
    label: r.nickname ? `${r.nickname} (${r.tagId})` : r.tagId,
  }));
}

export async function listRabbitOptions(): Promise<AnimalOption[]> {
  const rows = await db
    .select({ id: rabbits.id, tagId: rabbits.tagId, nickname: rabbits.nickname })
    .from(rabbits)
    .where(eq(rabbits.status, "activo"))
    .orderBy(asc(rabbits.tagId));
  return rows.map((r) => ({
    id: r.id,
    label: r.nickname ? `${r.nickname} (${r.tagId})` : r.tagId,
  }));
}
