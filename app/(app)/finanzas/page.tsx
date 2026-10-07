import { Download, Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { PeriodSummary } from "@/components/finance/period-summary";
import { MonthlyChart } from "@/components/finance/monthly-chart";
import { CategoryBreakdown } from "@/components/finance/category-breakdown";
import { TransactionFilters } from "@/components/finance/transaction-filters";
import { TransactionList } from "@/components/finance/transaction-list";
import {
  isAfter,
  periodLabel,
  shiftPeriod,
  type Period,
} from "@/components/finance/period";
import {
  getBalance,
  getCategoryBreakdown,
  getMonthlyBuckets,
  listTransactions,
  type TxCategory,
} from "@/lib/queries/transactions";
import { transactionCategory, transactionType } from "@/lib/validations";
import { nowParts, todayIso } from "@/lib/dates";

export const metadata = { title: "Finanzas" };
export const dynamic = "force-dynamic";

function toInt(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

function resolvePeriod(
  sp: { period?: string; year?: string; month?: string },
  now: { year: number; month: number },
): Period {
  const y = toInt(sp.year);
  const year = y !== null && y >= 2000 && y <= 2100 ? y : now.year;
  if (sp.period === "year") {
    return { kind: "year", year: Math.min(year, now.year) };
  }
  const m = toInt(sp.month);
  const month = m !== null && m >= 1 && m <= 12 ? m : now.month;
  const p: Period = { kind: "month", year, month };
  return isAfter(p, now) ? { kind: "month", ...now } : p;
}

/** Último mes de la ventana de 12 meses del gráfico para el periodo elegido. */
function chartEnd(p: Period, now: { year: number; month: number }) {
  if (p.kind === "month") {
    const diff = now.year * 12 + now.month - (p.year * 12 + p.month);
    if (diff < 12) return now;
  }
  return p.year === now.year ? now : { year: p.year, month: 12 };
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    year?: string;
    month?: string;
    type?: string;
    category?: string;
    q?: string;
  }>;
}) {
  const sp = await searchParams;
  const { year: nowYear, month: nowMonth } = nowParts();
  const now = { year: nowYear, month: nowMonth };
  const period = resolvePeriod(sp, now);
  const prev = shiftPeriod(period, -1);
  const range = {
    year: period.year,
    month: period.kind === "month" ? period.month : undefined,
  };

  const typeParsed = transactionType.safeParse(sp.type);
  const type = typeParsed.success ? typeParsed.data : "all";
  const catParsed = transactionCategory.safeParse(sp.category);
  const category = catParsed.success ? catParsed.data : "all";
  const q = (sp.q ?? "").slice(0, 100);

  const [current, previous, buckets, breakdown, txs] = await Promise.all([
    getBalance(range),
    getBalance({
      year: prev.year,
      month: prev.kind === "month" ? prev.month : undefined,
    }),
    getMonthlyBuckets(chartEnd(period, now)),
    getCategoryBreakdown(range),
    listTransactions({ ...range, type, category, q }),
  ]);

  const byCategory: Partial<Record<TxCategory, number>> = {};
  let gastoCount = 0;
  let ingresoCount = 0;
  for (const row of breakdown) {
    byCategory[row.category] = (byCategory[row.category] ?? 0) + row.count;
    if (row.type === "gasto") gastoCount += row.count;
    else ingresoCount += row.count;
  }

  const exportHref = `/api/export/transactions?year=${period.year}${
    period.kind === "month" ? `&month=${period.month}` : ""
  }`;
  const filtered = type !== "all" || category !== "all" || q !== "";
  const name = periodLabel(period);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Finanzas"
        description="Ingresos y gastos"
        action={
          <Button asChild variant="outline" size="sm" className="h-11 px-3.5">
            <a href={exportHref} download aria-label={`Exportar movimientos de ${name} en CSV`}>
              <Download className="h-4 w-4" aria-hidden />
              Exportar
            </a>
          </Button>
        }
      />

      <PeriodSummary
        period={period}
        current={current}
        previous={previous}
        now={now}
      />

      <MonthlyChart
        key={`${buckets[0].year}-${buckets[0].month}`}
        buckets={buckets}
        selected={period}
      />

      <CategoryBreakdown totals={breakdown} periodName={name} />

      <section aria-labelledby="movimientos" className="space-y-3 pt-2">
        <h2 id="movimientos" className="text-lg font-semibold tracking-tight">
          Movimientos
        </h2>
        <TransactionFilters
          type={type}
          category={category}
          q={q}
          counts={{
            all: gastoCount + ingresoCount,
            gasto: gastoCount,
            ingreso: ingresoCount,
            byCategory,
          }}
        />

        {txs.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title={filtered ? "Nada con estos filtros" : "Sin movimientos"}
            description={
              filtered
                ? "Prueba con otra categoría u otra búsqueda."
                : `No hay movimientos en ${name}. Pulsa + para registrar uno.`
            }
          />
        ) : (
          <TransactionList transactions={txs} today={todayIso()} />
        )}
      </section>
    </div>
  );
}
