import Link from "next/link";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
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
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button asChild size="sm">
          <Link href={newHref}>+ Movimiento</Link>
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title="Sin movimientos"
          description="Aún no hay gastos ni ingresos asociados a este animal."
        />
      ) : (
        <div className="grid gap-2">
          {transactions.map((t) => (
            <Card key={t.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={t.type === "ingreso" ? "success" : "secondary"}
                    >
                      {t.type === "ingreso" ? "Ingreso" : "Gasto"}
                    </Badge>
                    <span className="text-sm font-medium">
                      {transactionCategoryLabels[t.category]}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {formatDateEs(t.date)}
                    {t.description ? ` · ${t.description}` : ""}
                  </div>
                </div>
                <div
                  className={`font-mono text-sm font-semibold ${
                    t.type === "ingreso"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : ""
                  }`}
                >
                  {t.type === "ingreso" ? "+" : "−"}
                  {formatEur(t.amountEur)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
