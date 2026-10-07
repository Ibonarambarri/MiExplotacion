"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { isAuthenticated } from "@/lib/auth";
import { setSetting } from "@/lib/settings";

type Result = { ok: true } | { ok: false; error: string };

async function guard(): Promise<Result | null> {
  if (!(await isAuthenticated())) return { ok: false, error: "Sesión caducada." };
  return null;
}

function done(): Result {
  // Los ajustes se leen en Inicio, formularios y exportaciones.
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function saveFarmName(name: string): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = z.string().trim().min(1).max(60).safeParse(name);
  if (!parsed.success) return { ok: false, error: "Escribe un nombre (máx. 60 caracteres)." };
  await setSetting("farmName", parsed.data);
  return done();
}

const daysSchema = z.coerce.number().int();

export async function saveGestationDays(input: {
  sheep: number | string;
  rabbit: number | string;
}): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  const sheep = daysSchema.min(130).max(170).safeParse(input.sheep);
  if (!sheep.success) return { ok: false, error: "Ovejas: entre 130 y 170 días." };
  const rabbit = daysSchema.min(25).max(40).safeParse(input.rabbit);
  if (!rabbit.success) return { ok: false, error: "Conejas: entre 25 y 40 días." };
  await setSetting("sheepGestationDays", sheep.data);
  await setSetting("rabbitGestationDays", rabbit.data);
  return done();
}

export async function saveVaccinePresets(presets: string[]): Promise<Result> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = z.array(z.string().trim().min(1).max(128)).max(50).safeParse(presets);
  if (!parsed.success) return { ok: false, error: "Lista de vacunas no válida." };
  // Sin duplicados (ignorando mayúsculas), manteniendo el orden.
  const seen = new Set<string>();
  const clean = parsed.data.filter((p) => {
    const k = p.toLocaleLowerCase("es");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  await setSetting("vaccinePresets", clean);
  return done();
}
