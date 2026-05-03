import { Card, CardContent } from "@/components/ui/card";
import { formatEur } from "@/lib/utils";
import type { MonthBucket } from "@/lib/queries/transactions";

const MONTHS_ES = [
  "ene",
  "feb",
  "mar",
  "abr",
  "may",
  "jun",
  "jul",
  "ago",
  "sep",
  "oct",
  "nov",
  "dic",
];

export function MonthlyChart({ buckets }: { buckets: MonthBucket[] }) {
  const max = Math.max(
    1,
    ...buckets.map((b) => Math.max(b.ingresos, b.gastos)),
  );
  const totalIngresos = buckets.reduce((s, b) => s + b.ingresos, 0);
  const totalGastos = buckets.reduce((s, b) => s + b.gastos, 0);

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Últimos 12 meses
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              {formatEur(totalIngresos)}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500" />
              {formatEur(totalGastos)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-1">
          {buckets.map((b) => {
            const ingH = (b.ingresos / max) * 100;
            const gasH = (b.gastos / max) * 100;
            return (
              <div
                key={`${b.year}-${b.month}`}
                className="flex flex-col items-center gap-1"
                title={`${MONTHS_ES[b.month - 1]} ${b.year} · +${formatEur(b.ingresos)} / −${formatEur(b.gastos)}`}
              >
                <div className="relative flex h-24 w-full items-end justify-center gap-0.5">
                  <span
                    className="w-1/2 rounded-sm bg-emerald-500"
                    style={{ height: `${ingH}%` }}
                    aria-hidden
                  />
                  <span
                    className="w-1/2 rounded-sm bg-rose-500"
                    style={{ height: `${gasH}%` }}
                    aria-hidden
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {MONTHS_ES[b.month - 1]}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
