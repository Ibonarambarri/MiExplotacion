import { Card, CardContent } from "@/components/ui/card";
import { formatEur } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function BalanceCard({
  title,
  ingresos,
  gastos,
  className,
}: {
  title: string;
  ingresos: number;
  gastos: number;
  className?: string;
}) {
  const balance = ingresos - gastos;
  const positive = balance >= 0;
  return (
    <Card className={className}>
      <CardContent className="space-y-2 p-4">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </div>
        <div
          className={cn(
            "font-mono text-2xl font-semibold",
            positive
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-destructive",
          )}
        >
          {positive ? "+" : "−"}
          {formatEur(Math.abs(balance))}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>↑ {formatEur(ingresos)}</span>
          <span>↓ {formatEur(gastos)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
