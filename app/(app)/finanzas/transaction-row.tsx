"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { deleteTransactionAction } from "@/actions/transactions";
import { transactionCategoryLabels } from "@/lib/validations";
import { formatDateEs, formatEur } from "@/lib/utils";

interface Tx {
  id: number;
  date: string;
  type: "ingreso" | "gasto";
  category: keyof typeof transactionCategoryLabels;
  amountEur: string;
  description: string | null;
  sheepId: number | null;
  rabbitId: number | null;
  sheepLabel: string | null;
  rabbitLabel: string | null;
}

export function TransactionRow({ tx }: { tx: Tx }) {
  const [askDelete, setAskDelete] = useState(false);
  const animalLink =
    tx.sheepId && tx.sheepLabel
      ? { href: `/ovejas/${tx.sheepId}`, label: tx.sheepLabel }
      : tx.rabbitId && tx.rabbitLabel
        ? { href: `/conejas/${tx.rabbitId}`, label: tx.rabbitLabel }
        : null;

  return (
    <>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="min-w-0 flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <Badge variant={tx.type === "ingreso" ? "success" : "secondary"}>
                {tx.type === "ingreso" ? "Ingreso" : "Gasto"}
              </Badge>
              <span className="text-sm font-medium">
                {transactionCategoryLabels[tx.category]}
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDateEs(tx.date)}
              {tx.description ? ` · ${tx.description}` : ""}
            </div>
            {animalLink && (
              <Link
                href={animalLink.href}
                className="inline-block text-xs text-primary hover:underline"
              >
                {animalLink.label}
              </Link>
            )}
          </div>
          <div
            className={`shrink-0 font-mono text-sm font-semibold ${
              tx.type === "ingreso"
                ? "text-emerald-600 dark:text-emerald-400"
                : ""
            }`}
          >
            {tx.type === "ingreso" ? "+" : "−"}
            {formatEur(tx.amountEur)}
          </div>
          <div className="flex shrink-0 flex-col gap-1">
            <Button asChild variant="ghost" size="icon" aria-label="Editar">
              <Link href={`/finanzas/${tx.id}/editar`}>
                <Pencil className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Eliminar"
              onClick={() => setAskDelete(true)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={askDelete}
        onOpenChange={setAskDelete}
        title="¿Eliminar movimiento?"
        description={`${tx.type === "ingreso" ? "+" : "−"}${formatEur(tx.amountEur)} · ${formatDateEs(tx.date)}`}
        onConfirm={async () => {
          const r = await deleteTransactionAction(tx.id);
          if (r.ok) toast.success("Movimiento eliminado");
          return r;
        }}
      />
    </>
  );
}
