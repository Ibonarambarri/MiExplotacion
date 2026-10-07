import Link from "next/link";
import { Plus, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { ListGroup, ListRow, RowIcon } from "@/components/ui/list";
import { EmptyState } from "@/components/empty-state";
import { formatDateEs, formatEur } from "@/lib/utils";
import { transactionCategoryLabels } from "@/lib/validations";
import type { Transaction } from "@/db/schema";

export function ExpensesTab({
  transactions,
  newHref,
}: {
  transactions: Transaction[];
  newHref: string;
}) {
  const income = transactions
    .filter((t) => t.type === "ingreso")
    .reduce((s, t) => s + Number(t.amountEur), 0);
  const expenses = transactions
    .filter((t) => t.type === "gasto")
    .reduce((s, t) => s + Number(t.amountEur), 0);
  const balance = income - expenses;

  return (
    <div className="space-y-4">
      {transactions.length > 0 && (
        <Card className="grid grid-cols-3 gap-3 p-4">
          <Stat label="Ingresos" value={formatEur(income)} tone="positive" />
          <Stat label="Gastos" value={formatEur(expenses)} />
          <Stat
            label="Balance"
            value={formatEur(balance)}
            tone={balance >= 0 ? "positive" : "negative"}
          />
        </Card>
      )}

      {transactions.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title="Sin movimientos"
          description="Aún no hay gastos ni ingresos asociados a este animal."
          action={
            <Button asChild>
              <Link href={newHref}>
                <Plus className="h-4 w-4" aria-hidden /> Añadir movimiento
              </Link>
            </Button>
          }
        />
      ) : (
        <ListGroup
          title="Movimientos"
          action={
            <Button asChild size="sm" variant="ghost" className="-my-2 -mr-2 h-11 text-primary">
              <Link href={newHref}>
                <Plus className="h-4 w-4" aria-hidden /> Añadir
              </Link>
            </Button>
          }
        >
          {transactions.map((t) => {
            const inc = t.type === "ingreso";
            return (
              <ListRow
                key={t.id}
                href={`/finanzas/${t.id}/editar`}
                chevron={false}
                leading={
                  <RowIcon tone={inc ? "success" : "muted"}>
                    {inc ? <TrendingUp /> : <TrendingDown />}
                  </RowIcon>
                }
                title={t.description || transactionCategoryLabels[t.category]}
                subtitle={
                  <span className="tabular">
                    {formatDateEs(t.date)} · {transactionCategoryLabels[t.category]}
                  </span>
                }
                trailing={
                  <span
                    className={
                      inc
                        ? "tabular text-[15px] font-semibold text-success"
                        : "tabular text-[15px] font-semibold"
                    }
                  >
                    {inc ? "+" : "−"}
                    {formatEur(t.amountEur)}
                  </span>
                }
              />
            );
          })}
        </ListGroup>
      )}
    </div>
  );
}
