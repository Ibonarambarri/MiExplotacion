import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { buildFarmBook, type BookKind } from "@/lib/queries/backup";
import { getSettings } from "@/lib/settings";
import { nowParts, todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { PrintButton } from "./print-button";

export const metadata: Metadata = { title: "Libro de explotación" };

const KIND_LABEL: Record<BookKind, string> = { oveja: "Oveja", coneja: "Coneja" };
const REASON_LABEL: Record<string, string> = {
  nacimiento: "Nacimiento",
  entrada: "Entrada",
  vendido: "Venta",
  muerto: "Muerte",
  sacrificado: "Sacrificio",
};

function fmt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 14mm 12mm; }
  html, body { background: #fff !important; color: #000 !important; }
  nav, .fixed, [data-sonner-toaster] { display: none !important; }
  main { max-width: none !important; padding: 0 !important; }
  .book-section { break-inside: auto; }
  .book-table tr { break-inside: avoid; }
  .book-table th { background: #eee !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  a { color: inherit !important; text-decoration: none !important; }
}
`;

function Section({
  title,
  count,
  children,
}: {
  title: string;
  count?: number;
  children: React.ReactNode;
}) {
  return (
    <section className="book-section space-y-2">
      <h2 className="flex items-baseline justify-between border-b border-border pb-1 text-base font-semibold print:border-black">
        {title}
        {count !== undefined && (
          <span className="tabular text-sm font-normal text-muted-foreground print:text-black">
            {count}
          </span>
        )}
      </h2>
      {children}
    </section>
  );
}

function Table({
  head,
  rows,
  empty,
}: {
  head: string[];
  rows: React.ReactNode[][];
  empty: string;
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-muted-foreground print:text-black">{empty}</p>;
  }
  return (
    <div className="-mx-4 overflow-x-auto px-4 print:mx-0 print:overflow-visible print:px-0">
      <table className="book-table w-full min-w-[32rem] border-collapse text-left text-[13px] print:min-w-0 print:text-[10.5pt]">
        <thead>
          <tr>
            {head.map((h) => (
              <th
                key={h}
                className="border-b border-border bg-muted/60 px-2 py-1.5 font-semibold print:border-black"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-border/60 print:border-neutral-400">
              {r.map((c, j) => (
                <td key={j} className={cn("px-2 py-1.5 align-top", j === 0 && "whitespace-nowrap")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function LibroPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const { year: yearParam } = await searchParams;
  const current = nowParts().year;
  const parsed = Number(yearParam);
  const year =
    Number.isInteger(parsed) && parsed >= 2000 && parsed <= current ? parsed : current;

  const [book, settings] = await Promise.all([buildFarmBook(year), getSettings()]);
  const { census } = book;

  return (
    <div className="space-y-6 print:space-y-5">
      <style>{PRINT_CSS}</style>

      <div className="flex items-center justify-between gap-2 print:hidden">
        <Link
          href="/mas"
          className="pressable -ml-2 inline-flex h-11 items-center gap-1 rounded-xl px-2 text-[15px] font-medium text-primary"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
          Más
        </Link>
        <PrintButton />
      </div>

      <header className="space-y-1">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground print:text-black">
          Libro de explotación · {year}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{settings.farmName}</h1>
        <p className="text-sm text-muted-foreground print:text-black">
          Generado el {fmt(todayIso())}
        </p>
        <nav aria-label="Año" className="flex gap-2 pt-2 print:hidden">
          {[current - 2, current - 1, current].filter((y) => y >= 2000).map((y) => (
            <Link
              key={y}
              href={y === current ? "/mas/libro" : `/mas/libro?year=${y}`}
              aria-current={y === year ? "page" : undefined}
              className={cn(
                "pressable inline-flex h-9 items-center rounded-full border px-3.5 text-sm font-medium tabular",
                y === year
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-card",
              )}
            >
              {y}
            </Link>
          ))}
        </nav>
      </header>

      <Section title="Censo actual">
        <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 print:grid-cols-4">
          {[
            ["Ovejas", census.sheep.length],
            ["Corderos", census.lambsAlive],
            ["Conejas", census.rabbits.length],
            ["Gazapos", census.kitsAlive],
          ].map(([label, n]) => (
            <div
              key={label}
              className="rounded-xl border border-border/60 bg-card px-3 py-2 print:border-black"
            >
              <dt className="text-muted-foreground print:text-black">{label}</dt>
              <dd className="tabular text-xl font-semibold">{n}</dd>
            </div>
          ))}
        </dl>
        <Table
          head={["Crotal", "Especie", "Nombre", "Nacimiento"]}
          rows={[...census.sheep, ...census.rabbits].map((a) => [
            a.tagId,
            KIND_LABEL[a.kind],
            a.nickname ?? "—",
            fmt(a.birthDate),
          ])}
          empty="No hay animales activos."
        />
      </Section>

      <Section title={`Altas ${year}`} count={book.altas.length}>
        <Table
          head={["Fecha", "Crotal", "Especie", "Motivo"]}
          rows={book.altas.map((m) => [
            fmt(m.date),
            m.tagId,
            KIND_LABEL[m.kind],
            REASON_LABEL[m.reason] ?? m.reason,
          ])}
          empty="Sin altas este año."
        />
      </Section>

      <Section title={`Bajas ${year}`} count={book.bajas.length}>
        <Table
          head={["Fecha", "Crotal", "Especie", "Motivo", "Causa"]}
          rows={book.bajas.map((m) => [
            fmt(m.date),
            m.tagId,
            KIND_LABEL[m.kind],
            REASON_LABEL[m.reason] ?? m.reason,
            m.detail || "—",
          ])}
          empty="Sin bajas este año."
        />
      </Section>

      <Section title={`Vacunaciones ${year}`} count={book.vaccines.length}>
        <Table
          head={["Fecha", "Crotal", "Especie", "Vacuna", "Dosis", "Veterinario", "Próxima"]}
          rows={book.vaccines.map((v) => [
            fmt(v.date),
            v.tagId,
            KIND_LABEL[v.kind],
            v.type,
            v.dose || "—",
            v.vet || "—",
            fmt(v.nextDoseDate),
          ])}
          empty="Sin vacunaciones este año."
        />
      </Section>

      <Section title={`Tratamientos ${year}`} count={book.treatments.length}>
        <Table
          head={["Inicio", "Crotal", "Especie", "Enfermedad", "Medicamento", "Dosis", "Fin"]}
          rows={book.treatments.map((t) => [
            fmt(t.startDate),
            t.tagId,
            KIND_LABEL[t.kind],
            t.name,
            t.medication || "—",
            t.dose || "—",
            t.resolved ? fmt(t.resolvedDate) : "En curso",
          ])}
          empty="Sin tratamientos este año."
        />
      </Section>
    </div>
  );
}
