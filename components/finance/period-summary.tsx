"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Segmented } from "@/components/ui/segmented";
import { cn } from "@/lib/utils";
import { fmtEur, fmtPct, fmtSigned, variation } from "./format";
import {
  isAfter,
  periodLabel,
  periodParams,
  periodShortLabel,
  shiftPeriod,
  withParams,
  type Period,
} from "./period";

interface Totals {
  ingresos: number;
  gastos: number;
}

export function PeriodSummary({
  period,
  current,
  previous,
  now,
}: {
  period: Period;
  current: Totals;
  previous: Totals;
  now: { year: number; month: number };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const prev = shiftPeriod(period, -1);
  const next = shiftPeriod(period, 1);
  const nextDisabled = isAfter(next, now);
  const hrefFor = (p: Period) => `${pathname}${withParams(sp, periodParams(p))}`;

  function changeKind(kind: Period["kind"]) {
    if (kind === period.kind) return;
    const target: Period =
      kind === "year"
        ? { kind: "year", year: period.year }
        : {
            kind: "month",
            year: period.year,
            month: period.year === now.year ? now.month : 12,
          };
    startTransition(() => router.replace(hrefFor(target), { scroll: false }));
  }

  const balance = current.ingresos - current.gastos;
  const prevBalance = previous.ingresos - previous.gastos;
  const balanceVar = variation(balance, prevBalance);
  const ingVar = variation(current.ingresos, previous.ingresos);
  const gasVar = variation(current.gastos, previous.gastos);
  const prevName = periodShortLabel(prev);

  return (
    <section
      aria-label={`Resumen de ${periodLabel(period)}`}
      className="rounded-3xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
    >
      <Segmented
        aria-label="Periodo"
        value={period.kind}
        onChange={changeKind}
        options={[
          { value: "month", label: "Mes" },
          { value: "year", label: "Año" },
        ]}
      />

      <div className="mt-3 flex items-center justify-between gap-2">
        <Link
          href={hrefFor(prev)}
          replace
          scroll={false}
          aria-label={`Ver ${periodLabel(prev)}`}
          className="pressable -ml-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground active:bg-accent"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Link>
        <h2
          className={cn(
            "text-base font-semibold transition-opacity duration-200",
            pending && "opacity-60",
          )}
          aria-live="polite"
        >
          {periodLabel(period)}
        </h2>
        {nextDisabled ? (
          <span
            aria-hidden
            className="-mr-2 inline-flex h-11 w-11 items-center justify-center text-muted-foreground/30"
          >
            <ChevronRight className="h-5 w-5" />
          </span>
        ) : (
          <Link
            href={hrefFor(next)}
            replace
            scroll={false}
            aria-label={`Ver ${periodLabel(next)}`}
            className="pressable -mr-2 inline-flex h-11 w-11 items-center justify-center rounded-full text-muted-foreground active:bg-accent"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </Link>
        )}
      </div>

      <div className="mt-2 text-center">
        <div className="text-xs font-medium text-muted-foreground">Balance</div>
        <div
          className={cn(
            "tabular mt-0.5 text-4xl font-semibold tracking-tight",
            balance > 0 && "text-success",
            balance < 0 && "text-destructive",
          )}
        >
          {fmtSigned(balance)}
        </div>
        <div className="mt-1.5 flex justify-center">
          {balanceVar === null ? (
            <span className="text-xs text-muted-foreground">
              Sin datos de {prevName} para comparar
            </span>
          ) : (
            <span
              className={cn(
                "tabular inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                balanceVar >= 0
                  ? "bg-success-soft text-success"
                  : "bg-danger-soft text-destructive",
              )}
            >
              {balanceVar >= 0 ? (
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5" aria-hidden />
              )}
              {balanceVar >= 0 ? "+" : "−"}
              {fmtPct(Math.abs(balanceVar))} vs. {prevName}
            </span>
          )}
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-2">
        <TotalCell
          label="Ingresos"
          value={current.ingresos}
          change={ingVar}
          tone="income"
        />
        <TotalCell
          label="Gastos"
          value={current.gastos}
          change={gasVar}
          tone="expense"
        />
      </dl>
    </section>
  );
}

function TotalCell({
  label,
  value,
  change,
  tone,
}: {
  label: string;
  value: number;
  change: number | null;
  tone: "income" | "expense";
}) {
  const Icon = tone === "income" ? ArrowUpRight : ArrowDownRight;
  return (
    <div className="rounded-2xl bg-muted/60 p-3">
      <dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <span
          className={cn(
            "inline-flex h-5 w-5 items-center justify-center rounded-full",
            tone === "income"
              ? "bg-success-soft text-success"
              : "bg-danger-soft text-destructive",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
        {label}
      </dt>
      <dd className="tabular mt-1 truncate text-lg font-semibold tracking-tight">
        {fmtEur(value)}
      </dd>
      <dd className="tabular text-xs text-muted-foreground">
        {change === null
          ? "—"
          : `${change >= 0 ? "+" : "−"}${fmtPct(Math.abs(change))} vs. anterior`}
      </dd>
    </div>
  );
}
