"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sheep, rabbits } from "@/db/schema";
import type { ActionResult } from "@/actions/sheep";

/**
 * Fotos de animales: el cliente las comprime (WebP/JPEG) y nos manda dos
 * data URLs, la foto (~1024 px) y la miniatura (128 px) para listados.
 */
const DATA_URL = /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/]+=*$/;
// Límite holgado bajo el máximo de 1 MB por petición de las Server Actions.
const MAX_PHOTO = 900_000;
const MAX_THUMB = 80_000;

function table(kind: "oveja" | "coneja") {
  return kind === "oveja" ? sheep : rabbits;
}

function refresh(kind: "oveja" | "coneja", id: number) {
  const base = kind === "oveja" ? "/ovejas" : "/conejas";
  revalidatePath(base);
  revalidatePath(`${base}/${id}`);
}

export async function setAnimalPhotoAction(
  kind: "oveja" | "coneja",
  id: number,
  photo: string,
  thumb: string,
): Promise<ActionResult> {
  if (typeof photo !== "string" || typeof thumb !== "string") {
    return { ok: false, error: "Imagen inválida." };
  }
  if (!DATA_URL.test(photo) || !DATA_URL.test(thumb)) {
    return { ok: false, error: "Formato de imagen no admitido." };
  }
  if (photo.length > MAX_PHOTO || thumb.length > MAX_THUMB) {
    return { ok: false, error: "La foto es demasiado grande. Prueba con otra." };
  }
  const t = table(kind);
  await db
    .update(t)
    .set({ photo, photoThumb: thumb, updatedAt: new Date() })
    .where(eq(t.id, id));
  refresh(kind, id);
  return { ok: true };
}

export async function removeAnimalPhotoAction(
  kind: "oveja" | "coneja",
  id: number,
): Promise<ActionResult> {
  const t = table(kind);
  await db
    .update(t)
    .set({ photo: null, photoThumb: null, updatedAt: new Date() })
    .where(eq(t.id, id));
  refresh(kind, id);
  return { ok: true };
}
