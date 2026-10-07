import type { NextRequest } from "next/server";
import {
  listActiveDiseases,
  listOverdueVaccines,
  listUpcomingBirths,
  listUpcomingVaccines,
} from "@/lib/queries/events";
import { isPushConfigured, sendToAll } from "@/lib/push";
import { daysUntil } from "@/lib/dates";

/**
 * Resumen diario por notificación push. Lo llama Vercel Cron (vercel.json)
 * con `Authorization: Bearer ${CRON_SECRET}`. Solo lee datos del ganado;
 * únicamente borra suscripciones push caducadas.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!isPushConfigured()) {
    return Response.json({ skipped: "push no configurado" });
  }

  const [overdue, soonVaccines, births, diseases] = await Promise.all([
    listOverdueVaccines(),
    listUpcomingVaccines(1),
    listUpcomingBirths(3),
    listActiveDiseases(),
  ]);

  const lines: string[] = [];
  const plural = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;

  if (overdue.length) {
    lines.push(`${plural(overdue.length, "vacuna vencida", "vacunas vencidas")}`);
  }
  const today = soonVaccines.filter((v) => daysUntil(v.nextDoseDate) <= 0);
  const tomorrow = soonVaccines.length - today.length;
  if (today.length) {
    lines.push(
      today.length === 1
        ? `Vacuna hoy: ${today[0].type} · ${today[0].animalLabel}`
        : `${today.length} vacunas para hoy`,
    );
  }
  if (tomorrow) lines.push(`${plural(tomorrow, "vacuna", "vacunas")} mañana`);

  if (births.length) {
    const next = births[0];
    const d = daysUntil(next.expectedBirthDate);
    const when = d <= 0 ? "hoy" : d === 1 ? "mañana" : `en ${d} días`;
    lines.push(
      births.length === 1
        ? `Parto ${when}: ${next.animalLabel}`
        : `${births.length} partos en los próximos 3 días (el primero ${when})`,
    );
  }
  if (diseases.length) {
    lines.push(
      `${plural(diseases.length, "tratamiento activo", "tratamientos activos")}`,
    );
  }

  if (lines.length === 0) {
    return Response.json({ sent: 0, reason: "nada pendiente" });
  }

  const urgent = overdue.length + today.length + births.length;
  const result = await sendToAll({
    title: urgent > 0 ? "Tareas de hoy en la explotación" : "Resumen de la explotación",
    body: lines.join("\n"),
    url: "/calendario",
    tag: "resumen-diario",
  });

  return Response.json({ ...result, lines });
}
