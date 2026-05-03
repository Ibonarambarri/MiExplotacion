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
  };
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

  try {
    const [row] = await db
      .insert(sheep)
      .values(normalize(parsed.data))
      .returning({ id: sheep.id });
    revalidatePath("/ovejas");
    revalidatePath("/");
    redirect(`/ovejas/${row.id}`);
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

  try {
    await db
      .update(sheep)
      .set({ ...normalize(parsed.data), updatedAt: new Date() })
      .where(eq(sheep.id, id));
    revalidatePath("/ovejas");
    revalidatePath(`/ovejas/${id}`);
    revalidatePath("/");
    redirect(`/ovejas/${id}`);
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
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: string }).code === "23505"
  );
}
