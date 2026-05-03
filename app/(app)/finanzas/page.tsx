import { Wallet } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { BalanceCard } from "@/components/finance/balance-card";
import { MonthlyChart } from "@/components/finance/monthly-chart";
import {
  getBalance,
  getMonthlyBuckets,
  listTransactions,
} from "@/lib/queries/transactions";
import {
  transactionCategory,
  transactionType,
} from "@/lib/validations";
import { FinanceFilters } from "./finance-filters";
import { TransactionRow } from "./transaction-row";

export const dynamic = "force-dynamic";

function parseInt(v: string | undefined): number | null {
  if (!v) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : null;
}

export default async function FinanzasPage({
  searchParams,
}: {
  searchParams: Promise<{
    year?: string;
    month?: string;
    type?: string;
    category?: string;
  }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const yearParam = parseInt(sp.year);
  const monthParam = sp.month && sp.month !== "all" ? parseInt(sp.month) : null;
  const year = yearParam ?? now.getFullYear();
  const month =
    monthParam !== null && monthParam >= 1 && monthParam <= 12
      ? monthParam
      : null;

  const typeParsed = transactionType.safeParse(sp.type);
  const type = typeParsed.success
    ? typeParsed.data
    : sp.type === "all" || !sp.type
      ? "all"
      : "all";

  const catParsed = transactionCategory.safeParse(sp.category);
  const category = catParsed.success
    ? catParsed.data
    : sp.category === "all" || !sp.category
      ? "all"
      : "all";

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const [
    balanceMonth,
    balanceYear,
    txs,
    buckets,
  ] = await Promise.all([
    getBalance({ year: currentYear, month: currentMonth }),
    getBalance({ year: currentYear }),
    listTransactions({
      year,
      month: month ?? undefined,
      type,
      category,
    }),
    getMonthlyBuckets(),
  ]);

  // Lista de años: desde el año mínimo de los buckets hasta el actual
  const minYear = Math.min(currentYear, ...buckets.map((b) => b.year));
  const years: number[] = [];
  for (let y = currentYear + 1; y >= minYear - 1; y--) years.push(y);

  return (
    <div>
      <PageHeader title="Finanzas" description="Ingresos y gastos" />

      <div className="grid grid-cols-2 gap-2">
        <BalanceCard
          title="Mes actual"
          ingresos={balanceMonth.ingresos}
          gastos={balanceMonth.gastos}
        />
        <BalanceCard
          title={`Año ${currentYear}`}
          ingresos={balanceYear.ingresos}
          gastos={balanceYear.gastos}
        />
      </div>

      <div className="mt-3">
        <MonthlyChart buckets={buckets} />
      </div>

      <h2 className="mt-6 mb-2 text-lg font-semibold">Movimientos</h2>
      <FinanceFilters
        year={year}
        month={month}
        type={type}
        category={category}
        years={years}
      />

      <div className="mt-3 grid gap-2">
        {txs.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title="Sin movimientos"
            description="Cambia los filtros o registra un nuevo movimiento."
          />
        ) : (
          txs.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
        )}
      </div>
    </div>
  );
}
