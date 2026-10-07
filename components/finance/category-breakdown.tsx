import { cn } from "@/lib/utils";
import type { CategoryTotal, TxType } from "@/lib/queries/transactions";
import { CATEGORY_META, CategoryIcon } from "./category-meta";
import { fmtEur, fmtPct } from "./format";

/** Desglose del periodo por categoría: barras horizontales con % del total. */
export function CategoryBreakdown({
  totals,
  periodName,
}: {
  totals: CategoryTotal[];
  periodName: string;
}) {
  const gastos = totals.filter((t) => t.type === "gasto" && t.total > 0);
  const ingresos = totals.filter((t) => t.type === "ingreso" && t.total > 0);
  if (gastos.length === 0 && ingresos.length === 0) return null;

  return (
    <section
      aria-label={`Desglose por categoría de ${periodName}`}
      className="rounded-3xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
    >
      <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
        Por categoría
      </h2>
      <div className="mt-3 space-y-5">
        {gastos.length > 0 && <Group title="Gastos" type="gasto" items={gastos} />}
        {ingresos.length > 0 && (
          <Group title="Ingresos" type="ingreso" items={ingresos} />
        )}
      </div>
    </section>
  );
}

function Group({
  title,
  type,
  items,
}: {
  title: string;
  type: TxType;
  items: CategoryTotal[];
}) {
  const total = items.reduce((s, i) => s + i.total, 0);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <h3 className="font-semibold">{title}</h3>
        <span className="tabular text-muted-foreground">{fmtEur(total)}</span>
      </div>
      <ul className="mt-2 space-y-3">
        {items.map((it) => {
          const share = total > 0 ? it.total / total : 0;
          return (
            <li key={it.category} className="flex items-center gap-3">
              <CategoryIcon category={it.category} />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="truncate font-medium">
                    {CATEGORY_META[it.category].label}
                  </span>
                  <span className="tabular shrink-0">
                    {fmtEur(it.total)}
                    <span className="ml-1.5 inline-block w-10 text-right text-xs text-muted-foreground">
                      {fmtPct(share)}
                    </span>
                  </span>
                </div>
                <div
                  className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`${CATEGORY_META[it.category].label}: ${fmtPct(share)} de los ${title.toLowerCase()}`}
                >
                  <div
                    className={cn(
                      "h-full origin-left rounded-full",
                      type === "gasto" ? "bg-chart-expense" : "bg-chart-income",
                    )}
                    style={{ transform: `scaleX(${share})` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
