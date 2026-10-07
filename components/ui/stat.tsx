import * as React from "react";
import { cn } from "@/lib/utils";

/** Celda de KPI: etiqueta pequeña + cifra grande. */
export function Stat({
  label,
  value,
  hint,
  tone,
  className,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "default" | "positive" | "negative" | "harvest";
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="truncate text-xs font-medium text-muted-foreground">{label}</div>
      <div
        className={cn(
          "tabular mt-0.5 truncate text-xl font-semibold tracking-tight",
          tone === "positive" && "text-success",
          tone === "negative" && "text-destructive",
          tone === "harvest" && "text-harvest",
        )}
      >
        {value}
      </div>
      {hint && <div className="truncate text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}
