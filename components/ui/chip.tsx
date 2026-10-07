"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/** Fila horizontal desplazable de chips de filtro. */
export function ChipGroup({
  className,
  children,
  label,
}: {
  className?: string;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-0.5",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Chip({
  active,
  count,
  icon,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "pressable inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-card text-foreground hover:bg-accent",
        "[&_svg]:h-4 [&_svg]:w-4",
        className,
      )}
      {...props}
    >
      {icon}
      {children}
      {count !== undefined && (
        <span
          className={cn(
            "tabular text-xs",
            active ? "text-background/70" : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
