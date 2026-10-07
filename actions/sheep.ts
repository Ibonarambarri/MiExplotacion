"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheep } from "@/db/schema";
import {
  animalSchema,
  fdObject,
  flattenZodError,
  type AnimalInput,
} from "@/lib/validations";

export type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

function normalize(input: AnimalInput) {
  const isDead = input.status === "muerto" || input.status === "sacrificado";
  return {
    tagId: input.tagId,
    nickname: input.nickname ?? null,
    birthDate: input.birthDate ?? null,
    status: input.status,
    deathDate: isDead ? (input.deathDate ?? null) : null,
    deathCause: isDead ? (input.deathCause ?? null) : null,
    notes: input.notes ?? null,
    motherId: input.motherId ?? null,
  };
}

/** La madre debe existir y no puede ser el propio animal. */
async function checkMother(
  motherId: number | undefined,
  selfId?: number,
): Promise<ActionResult | null> {
  if (motherId === undefined) return null;
  if (motherId === selfId) {
    return {
      ok: false,
      error: "Una oveja no puede ser su propia madre.",
      fieldErrors: { motherId: "Elige otra madre" },
    };
  }
  const [m] = await db
    .select({ id: sheep.id })
    .from(sheep)
    .where(eq(sheep.id, motherId))
    .limit(1);
  if (!m) {
    return {
      ok: false,
      error: "La madre elegida no existe.",
      fieldErrors: { motherId: "Madre no encontrada" },
    };
  }
  return null;
}

export async function createSheepAction(
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult<{ id: number }>> {
  const parsed = animalSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos marcados.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const motherError = await checkMother(parsed.data.motherId);
  if (motherError) return motherError as ActionResult<{ id: number }>;

  let id: number;
  try {
    const [row] = await db
      .insert(sheep)
      .values(normalize(parsed.data))
      .returning({ id: sheep.id });
    id = row.id;
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        error: "Ya existe una oveja con ese crotal.",
        fieldErrors: { tagId: "Crotal duplicado" },
      };
    }
    throw e;
  }
  revalidatePath("/ovejas");
  revalidatePath("/");
  if (parsed.data.motherId) revalidatePath(`/ovejas/${parsed.data.motherId}`);
  redirect(`/ovejas/${id}`);
}

export async function updateSheepAction(
  id: number,
  _prev: unknown,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = animalSchema.safeParse(fdObject(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: "Revisa los campos marcados.",
      fieldErrors: flattenZodError(parsed.error),
    };
  }
  const motherError = await checkMother(parsed.data.motherId, id);
  if (motherError) return motherError;

  try {
    await db
      .update(sheep)
      .set({ ...normalize(parsed.data), updatedAt: new Date() })
      .where(eq(sheep.id, id));
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        error: "Ya existe una oveja con ese crotal.",
        fieldErrors: { tagId: "Crotal duplicado" },
      };
    }
    throw e;
  }
  revalidatePath("/ovejas");
  revalidatePath(`/ovejas/${id}`);
  revalidatePath("/");
  redirect(`/ovejas/${id}?tab=datos`);
}

export async function deleteSheepAction(
  id: number,
): Promise<ActionResult> {
  await db.delete(sheep).where(eq(sheep.id, id));
  revalidatePath("/ovejas");
  revalidatePath("/");
  redirect("/ovejas");
}

function isUniqueViolation(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const code = (e as { code?: string }).code;
  const cause = (e as { cause?: { code?: string } }).cause?.code;
  return code === "23505" || cause === "23505";
}
