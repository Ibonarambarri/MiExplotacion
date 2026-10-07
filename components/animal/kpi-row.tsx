import Link from "next/link";
import { Baby, ChevronRight, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { daysUntil } from "@/lib/dates";
import { formatDateEs } from "@/lib/utils";
import type { AnimalKpis } from "@/lib/queries/indicators";

const eur0 = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const num1 = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 1 });

/** Fila de KPIs del animal + avisos (gestación, desvieje). */
export function AnimalKpiRow({
  kind,
  kpis,
  base,
}: {
  kind: "oveja" | "coneja";
  kpis: AnimalKpis;
  /** Ruta de la ficha, p. ej. /ovejas/3 */
  base: string;
}) {
  const p = kpis.pregnancy;
  const d = p ? daysUntil(p.expectedBirthDate) : null;
  return (
    <div className="space-y-2 pb-4">
      <Card className="grid grid-cols-4 gap-2 px-3 py-3 text-center">
        <Stat label="Partos" value={kpis.births} />
        <Stat label={kind === "oveja" ? "Corderos" : "Gazapos"} value={kpis.offspring} />
        <Stat
          label="Prolific."
          value={kpis.prolificacy !== null ? num1(kpis.prolificacy) : "—"}
          hint={kpis.prolificacy !== null ? "por parto" : undefined}
        />
        <Stat
          label="Rentab."
          value={kpis.income || kpis.expenses ? eur0.format(kpis.profit) : "—"}
          tone={!kpis.income && !kpis.expenses ? "default" : kpis.profit >= 0 ? "positive" : "negative"}
        />
      </Card>

      {p && d !== null && (
        <Link
          href={`${base}/crianzas/${p.breedingId}`}
          className="pressable flex min-h-12 items-center gap-3 rounded-2xl bg-harvest-soft px-4 py-2.5 text-harvest"
        >
          <Baby className="h-5 w-5 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 text-sm font-medium">
            Gestante, parto previsto {formatDateEs(p.expectedBirthDate).slice(0, 5)}
            <span className="tabular font-normal opacity-80">
              {" · "}
              {d > 0 ? `en ${d} ${d === 1 ? "día" : "días"}` : d === 0 ? "hoy" : `atrasado ${-d} ${d === -1 ? "día" : "días"}`}
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
        </Link>
      )}

      {kpis.cullCandidate && kpis.cullReason && (
        <div className="flex min-h-12 items-center gap-3 rounded-2xl bg-secondary px-4 py-2.5 text-secondary-foreground">
          <Flag className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-sm">
            <span className="font-medium">Candidata a desvieje:</span> {kpis.cullReason}
          </span>
        </div>
      )}
    </div>
  );
}
