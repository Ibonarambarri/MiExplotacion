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

/**
 * Posibles madres (misma especie, cualquier estado) para el formulario de
 * alta/edición. Excluye al propio animal.
 */
export async function listMotherOptions(
  kind: "oveja" | "coneja",
  excludeId?: number,
): Promise<AnimalOption[]> {
  const t = kind === "oveja" ? sheep : rabbits;
  const rows = await db
    .select({ id: t.id, tagId: t.tagId, nickname: t.nickname, status: t.status })
    .from(t)
    .orderBy(asc(t.tagId));
  return rows
    .filter((r) => r.id !== excludeId)
    .map((r) => ({
      id: r.id,
      label:
        (r.nickname ? `${r.nickname} (${r.tagId})` : r.tagId) +
        (r.status !== "activo" ? " · baja" : ""),
    }));
}
