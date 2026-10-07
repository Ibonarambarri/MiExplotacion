import { isAuthenticated } from "@/lib/auth";
import { listTransactions } from "@/lib/queries/transactions";
import { transactionCategoryLabels } from "@/lib/validations";

export const dynamic = "force-dynamic";

function toInt(v: string | null): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

/** Escapa un campo CSV con separador ";" (comillas si hace falta). */
function cell(v: string): string {
  return /[";\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

/** Neutraliza fórmulas en texto libre (=, +, -, @) al abrirlo en Excel. */
function safeText(v: string): string {
  return /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
}

/** Fecha YYYY-MM-DD → DD/MM/YYYY (lo que Excel en español reconoce). */
function esDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/** Importe con coma decimal y sin separador de miles: "1234,50". */
function esAmount(amount: string): string {
  return Number(amount).toFixed(2).replace(".", ",");
}

export async function GET(request: Request) {
  if (!(await isAuthenticated())) {
    return new Response("No autorizado", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const yearRaw = toInt(searchParams.get("year"));
  const monthRaw = toInt(searchParams.get("month"));
  const year = yearRaw !== null && yearRaw >= 2000 && yearRaw <= 2100 ? yearRaw : undefined;
  const month =
    year !== undefined && monthRaw !== null && monthRaw >= 1 && monthRaw <= 12
      ? monthRaw
      : undefined;

  const rows = await listTransactions({ year, month });

  const header = ["fecha", "tipo", "categoría", "importe", "descripción", "animal"];
  const lines = [header.join(";")];
  // Orden cronológico ascendente: más natural en una hoja de cálculo.
  for (const tx of [...rows].reverse()) {
    const animal =
      tx.sheepLabel ??
      tx.rabbitLabel ??
      tx.lambLabel ??
      (tx.litterId !== null ? "Camada" : "");
    lines.push(
      [
        esDate(tx.date),
        tx.type === "ingreso" ? "Ingreso" : "Gasto",
        transactionCategoryLabels[tx.category],
        esAmount(tx.amountEur),
        safeText(tx.description ?? ""),
        safeText(animal),
      ]
        .map(cell)
        .join(";"),
    );
  }

  const csv = `﻿${lines.join("\r\n")}\r\n`;
  const suffix =
    year === undefined
      ? "todo"
      : month === undefined
        ? String(year)
        : `${year}-${String(month).padStart(2, "0")}`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="movimientos-${suffix}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
