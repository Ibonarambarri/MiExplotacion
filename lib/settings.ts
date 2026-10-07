import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { RABBIT_GESTATION_DAYS, SHEEP_GESTATION_DAYS } from "@/lib/dates";

/** Ajustes de la explotación guardados en la tabla app_settings. */
export interface AppSettings {
  sheepGestationDays: number;
  rabbitGestationDays: number;
  /** Tipos de vacuna sugeridos en los formularios. */
  vaccinePresets: string[];
  /** Nombre de la explotación (aparece en Inicio y exportaciones). */
  farmName: string;
  /** Hora local (0-23) del resumen diario por notificación. */
  reminderHour: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  sheepGestationDays: SHEEP_GESTATION_DAYS,
  rabbitGestationDays: RABBIT_GESTATION_DAYS,
  vaccinePresets: [
    "Enterotoxemia",
    "Lengua azul",
    "Desparasitación",
    "Mixomatosis",
    "Hemorrágica vírica (VHD)",
  ],
  farmName: "Mi explotación",
  reminderHour: 8,
};

/**
 * Lee todos los ajustes con valores por defecto. Si la tabla aún no existe
 * (migración sin aplicar) devuelve los valores por defecto sin fallar.
 */
export async function getSettings(): Promise<AppSettings> {
  try {
    const rows = await db.select().from(schema.appSettings);
    const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    return { ...DEFAULT_SETTINGS, ...(stored as Partial<AppSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function setSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K],
): Promise<void> {
  await db
    .insert(schema.appSettings)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: schema.appSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function getGestationDays(kind: "oveja" | "coneja"): Promise<number> {
  const s = await getSettings();
  return kind === "oveja" ? s.sheepGestationDays : s.rabbitGestationDays;
}

// Evita lecturas sueltas: exporta también un helper por clave.
export async function getSetting<K extends keyof AppSettings>(
  key: K,
): Promise<AppSettings[K]> {
  try {
    const [row] = await db
      .select()
      .from(schema.appSettings)
      .where(eq(schema.appSettings.key, key));
    return (row?.value as AppSettings[K]) ?? DEFAULT_SETTINGS[key];
  } catch {
    return DEFAULT_SETTINGS[key];
  }
}
