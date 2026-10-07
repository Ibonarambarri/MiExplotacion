"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { isAuthenticated } from "@/lib/auth";
import { isPushConfigured, sendToAll } from "@/lib/push";

type Result = { ok: true; message?: string } | { ok: false; error: string };

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function subscribePush(
  sub: unknown,
  userAgent?: string,
): Promise<Result> {
  if (!(await isAuthenticated())) return { ok: false, error: "Sesión caducada." };
  if (!isPushConfigured()) {
    return { ok: false, error: "Las notificaciones no están configuradas en el servidor." };
  }
  const parsed = subscriptionSchema.safeParse(sub);
  if (!parsed.success) return { ok: false, error: "Suscripción no válida." };

  const { endpoint, keys } = parsed.data;
  await db
    .insert(schema.pushSubscriptions)
    .values({
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
      userAgent: userAgent?.slice(0, 300) ?? null,
    })
    .onConflictDoUpdate({
      target: schema.pushSubscriptions.endpoint,
      set: { p256dh: keys.p256dh, auth: keys.auth },
    });
  return { ok: true };
}

export async function unsubscribePush(endpoint: string): Promise<Result> {
  if (!(await isAuthenticated())) return { ok: false, error: "Sesión caducada." };
  if (typeof endpoint !== "string" || !endpoint) {
    return { ok: false, error: "Suscripción no válida." };
  }
  await db
    .delete(schema.pushSubscriptions)
    .where(eq(schema.pushSubscriptions.endpoint, endpoint));
  return { ok: true };
}

export async function sendTestPush(): Promise<Result> {
  if (!(await isAuthenticated())) return { ok: false, error: "Sesión caducada." };
  if (!isPushConfigured()) {
    return { ok: false, error: "Las notificaciones no están configuradas en el servidor." };
  }
  const r = await sendToAll({
    title: "Mi Explotación",
    body: "Las notificaciones funcionan. Cada mañana recibirás el resumen del día.",
    url: "/mas",
    tag: "prueba",
  });
  if (r.sent === 0) {
    return { ok: false, error: "No hay ningún dispositivo suscrito todavía." };
  }
  return {
    ok: true,
    message: r.sent === 1 ? "Notificación enviada." : `Enviada a ${r.sent} dispositivos.`,
  };
}
