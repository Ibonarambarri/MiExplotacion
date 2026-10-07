"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { rabbits } from "@/db/schema";
import {
  animalSchema,
  fdObject,
  flattenZodError,
  type AnimalInput,
} from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";

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

async function checkMother(
  motherId: number | undefined,
  selfId?: number,
): Promise<ActionResult | null> {
  if (motherId === undefined) return null;
  if (motherId === selfId) {
    return {
      ok: false,
      error: "Una coneja no puede ser su propia madre.",
      fieldErrors: { motherId: "Elige otra madre" },
    };
  }
  const [m] = await db
    .select({ id: rabbits.id })
    .from(rabbits)
    .where(eq(rabbits.id, motherId))
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

export async function createRabbitAction(
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
      .insert(rabbits)
      .values(normalize(parsed.data))
      .returning({ id: rabbits.id });
    id = row.id;
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        error: "Ya existe una coneja con ese identificador.",
        fieldErrors: { tagId: "Identificador duplicado" },
      };
    }
    throw e;
  }
  revalidatePath("/conejas");
  revalidatePath("/");
  if (parsed.data.motherId) revalidatePath(`/conejas/${parsed.data.motherId}`);
  redirect(`/conejas/${id}`);
}

export async function updateRabbitAction(
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
      .update(rabbits)
      .set({ ...normalize(parsed.data), updatedAt: new Date() })
      .where(eq(rabbits.id, id));
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      return {
        ok: false,
        error: "Ya existe una coneja con ese identificador.",
        fieldErrors: { tagId: "Identificador duplicado" },
      };
    }
    throw e;
  }
  revalidatePath("/conejas");
  revalidatePath(`/conejas/${id}`);
  revalidatePath("/");
  redirect(`/conejas/${id}?tab=datos`);
}

export async function deleteRabbitAction(id: number): Promise<ActionResult> {
  await db.delete(rabbits).where(eq(rabbits.id, id));
  revalidatePath("/conejas");
  revalidatePath("/");
  redirect("/conejas");
}

function isUniqueViolation(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const code = (e as { code?: string }).code;
  const cause = (e as { cause?: { code?: string } }).cause?.code;
  return code === "23505" || cause === "23505";
}
