import "server-only";
import webpush, { WebPushError } from "web-push";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";

/** Contenido que entiende public/sw.js en el evento `push`. */
export interface PushPayload {
  title: string;
  body: string;
  /** Ruta a abrir al tocar la notificación. */
  url?: string;
  /** Notificaciones con la misma etiqueta se reemplazan entre sí. */
  tag?: string;
}

let configured: boolean | null = null;

/**
 * Configura web-push con las claves VAPID del entorno. Si falta alguna, las
 * notificaciones quedan desactivadas (devuelve false) sin romper la app.
 */
export function isPushConfigured(): boolean {
  if (configured !== null) return configured;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!publicKey || !privateKey || !subject) {
    configured = false;
    return configured;
  }
  try {
    webpush.setVapidDetails(subject, publicKey, privateKey);
    configured = true;
  } catch (err) {
    console.error("[push] Claves VAPID no válidas:", err);
    configured = false;
  }
  return configured;
}

export interface SendResult {
  sent: number;
  failed: number;
  removed: number;
}

/**
 * Envía la notificación a todas las suscripciones guardadas. Las que el
 * servicio push da por caducadas (404/410) se eliminan de la tabla.
 */
export async function sendToAll(payload: PushPayload): Promise<SendResult> {
  const result: SendResult = { sent: 0, failed: 0, removed: 0 };
  if (!isPushConfigured()) return result;

  const subs = await db.select().from(schema.pushSubscriptions);
  const body = JSON.stringify(payload);

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          { TTL: 60 * 60 * 12, urgency: "normal", topic: payload.tag },
        );
        result.sent++;
      } catch (err) {
        if (
          err instanceof WebPushError &&
          (err.statusCode === 404 || err.statusCode === 410)
        ) {
          await db
            .delete(schema.pushSubscriptions)
            .where(eq(schema.pushSubscriptions.id, s.id));
          result.removed++;
        } else {
          console.error("[push] Error al enviar:", err);
          result.failed++;
        }
      }
    }),
  );
  return result;
}
