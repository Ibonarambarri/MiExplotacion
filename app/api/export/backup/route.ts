import { isAuthenticated } from "@/lib/auth";
import { buildBackup } from "@/lib/queries/backup";
import { todayIso } from "@/lib/dates";

/** Copia de seguridad completa en JSON. Requiere sesión. Solo lectura. */
export async function GET() {
  if (!(await isAuthenticated())) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const backup = await buildBackup();
  const filename = `mi-explotacion-copia-${todayIso()}.json`;

  return new Response(JSON.stringify(backup, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
