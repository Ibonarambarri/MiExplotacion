"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MONTHS_ES, MONTHS_ES_SHORT } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { MonthBucket } from "@/lib/queries/transactions";
import { fmtCompact, fmtEur, fmtSigned } from "./format";
import { periodParams, withParams, type Period } from "./period";

export function MonthlyChart({
  buckets,
  selected,
}: {
  buckets: MonthBucket[];
  selected: Period;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();
  const [active, setActive] = useState<number | null>(null);
  const [showCumulative, setShowCumulative] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Cierra el tooltip al tocar fuera o con Escape.
  useEffect(() => {
    if (active === null) return;
    function onPointer(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setActive(null);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setActive(null);
    }
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [active]);

  const { max, cumulative, cumMin, cumMax, totalIng, totalGas } = useMemo(() => {
    const max = Math.max(1, ...buckets.map((b) => Math.max(b.ingresos, b.gastos)));
    const cumulative: number[] = [];
    for (const b of buckets) {
      cumulative.push((cumulative.at(-1) ?? 0) + b.ingresos - b.gastos);
    }
    return {
      max: niceCeil(max),
      cumulative,
      cumMin: Math.min(0, ...cumulative),
      cumMax: Math.max(0, ...cumulative),
      totalIng: buckets.reduce((s, b) => s + b.ingresos, 0),
      totalGas: buckets.reduce((s, b) => s + b.gastos, 0),
    };
  }, [buckets]);

  const isSelected = (b: MonthBucket) =>
    selected.kind === "month"
      ? b.year === selected.year && b.month === selected.month
      : b.year === selected.year;

  function select(i: number) {
    const b = buckets[i];
    setActive((cur) => (cur === i ? null : i));
    if (selected.kind === "month" && isSelected(b)) return;
    const target: Period = { kind: "month", year: b.year, month: b.month };
    startTransition(() =>
      router.replace(`${pathname}${withParams(sp, periodParams(target))}`, {
        scroll: false,
      }),
    );
  }

  const first = buckets[0];
  const last = buckets[buckets.length - 1];
  const rangeLabel = `${MONTHS_ES[first.month - 1]} ${first.year} a ${MONTHS_ES[last.month - 1]} ${last.year}`;

  const cumRange = cumMax - cumMin || 1;
  const cumY = (v: number) => 100 - ((v - cumMin) / cumRange) * 100;
  const linePoints = cumulative
    .map((v, i) => `${((i + 0.5) / buckets.length) * 100},${cumY(v)}`)
    .join(" ");

  const activeBucket = active !== null ? buckets[active] : null;

  return (
    <section
      ref={rootRef}
      aria-label="Evolución mensual"
      className="rounded-3xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]"
    >
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
          Últimos 12 meses
        </h2>
        <span className="text-xs text-muted-foreground">Toca un mes</span>
      </div>

      {/* Leyenda */}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-chart-income" aria-hidden />
          Ingresos <span className="tabular text-muted-foreground">{fmtEur(totalIng)}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-[3px] bg-chart-expense" aria-hidden />
          Gastos <span className="tabular text-muted-foreground">{fmtEur(totalGas)}</span>
        </span>
        <button
          type="button"
          aria-pressed={showCumulative}
          onClick={() => setShowCumulative((v) => !v)}
          className={cn(
            "pressable -my-2 ml-auto inline-flex min-h-11 items-center gap-1.5 rounded-full px-2",
            showCumulative ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <span
            aria-hidden
            className={cn(
              "h-0.5 w-4 rounded-full",
              showCumulative ? "bg-foreground" : "bg-muted-foreground/50",
            )}
          />
          Acumulado
        </button>
      </div>

      <div
        role="group"
        aria-label={`Ingresos y gastos por mes, de ${rangeLabel}. Total ingresos ${fmtEur(totalIng)}, total gastos ${fmtEur(totalGas)}.`}
        className="relative mt-3"
      >
        {/* Tooltip */}
        {activeBucket && active !== null && (
          <div
            role="status"
            className={cn(
              "pointer-events-none absolute -top-2 z-10 w-max min-w-40 -translate-y-full rounded-xl border border-border/60 bg-popover px-3 py-2 text-xs shadow-lg",
              "animate-in fade-in-0 zoom-in-95 duration-150",
              active < 3 ? "" : active > buckets.length - 4 ? "-translate-x-full" : "-translate-x-1/2",
            )}
            style={{
              left:
                active < 3
                  ? `${(active / buckets.length) * 100}%`
                  : active > buckets.length - 4
                    ? `${((active + 1) / buckets.length) * 100}%`
                    : `${((active + 0.5) / buckets.length) * 100}%`,
            }}
          >
            <div className="font-semibold capitalize">
              {MONTHS_ES[activeBucket.month - 1]} {activeBucket.year}
            </div>
            <dl className="tabular mt-1 grid grid-cols-[auto_auto] gap-x-3 gap-y-0.5">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-[2px] bg-chart-income" aria-hidden />
                Ingresos
              </dt>
              <dd className="text-right font-medium">{fmtEur(activeBucket.ingresos)}</dd>
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-[2px] bg-chart-expense" aria-hidden />
                Gastos
              </dt>
              <dd className="text-right font-medium">{fmtEur(activeBucket.gastos)}</dd>
              <dt className="text-muted-foreground">Balance</dt>
              <dd className="text-right font-semibold">
                {fmtSigned(activeBucket.ingresos - activeBucket.gastos)}
              </dd>
              {showCumulative && (
                <>
                  <dt className="text-muted-foreground">Acumulado</dt>
                  <dd className="text-right font-medium">
                    {fmtSigned(cumulative[active])}
                  </dd>
                </>
              )}
            </dl>
          </div>
        )}

        {/* Área de dibujo */}
        <div className="relative h-36">
          {/* Rejilla */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {[1, 0.5].map((f) => (
              <div
                key={f}
                className="absolute inset-x-0 border-t border-dashed border-border"
                style={{ top: `${(1 - f) * 100}%` }}
              >
                <span className="tabular absolute right-0 -translate-y-full pb-0.5 text-[10px] text-muted-foreground">
                  {fmtCompact(max * f)}
                </span>
              </div>
            ))}
            <div className="absolute inset-x-0 bottom-0 border-t border-border" />
          </div>

          <div className="absolute inset-0 grid grid-cols-12">
            {buckets.map((b, i) => {
              const sel = isSelected(b);
              const dim = active !== null ? active !== i : false;
              return (
                <button
                  key={`${b.year}-${b.month}`}
                  type="button"
                  onClick={() => select(i)}
                  aria-pressed={sel}
                  aria-label={`${MONTHS_ES[b.month - 1]} ${b.year}: ingresos ${fmtEur(b.ingresos)}, gastos ${fmtEur(b.gastos)}, balance ${fmtSigned(b.ingresos - b.gastos)}`}
                  className={cn(
                    "group relative flex h-full items-end justify-center gap-[2px] rounded-lg px-[3px] outline-none",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    sel && "bg-accent/70",
                  )}
                >
                  <Bar value={b.ingresos} max={max} className="bg-chart-income" dim={dim} />
                  <Bar value={b.gastos} max={max} className="bg-chart-expense" dim={dim} />
                </button>
              );
            })}
          </div>

          {showCumulative && (
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 h-full w-full overflow-visible animate-in fade-in-0 duration-200"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polyline
                points={linePoints}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="text-foreground"
              />
            </svg>
          )}
        </div>

        {/* Eje X */}
        <div aria-hidden className="mt-1.5 grid grid-cols-12">
          {buckets.map((b) => (
            <span
              key={`${b.year}-${b.month}`}
              className={cn(
                "text-center text-[10px] leading-tight",
                isSelected(b) ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              {MONTHS_ES_SHORT[b.month - 1]}
              {b.month === 1 && (
                <span className="block text-[9px] text-muted-foreground">
                  {String(b.year).slice(2)}
                </span>
              )}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Bar({
  value,
  max,
  className,
  dim,
}: {
  value: number;
  max: number;
  className: string;
  dim: boolean;
}) {
  const ratio = Math.min(1, value / max);
  return (
    <span
      aria-hidden
      className={cn(
        "h-full w-full max-w-3 origin-bottom rounded-t-[3px] transition-[transform,opacity] duration-300 ease-out",
        className,
        dim && "opacity-40",
      )}
      style={{ transform: `scaleY(${value > 0 ? Math.max(ratio, 0.015) : 0})` }}
    />
  );
}

/** Redondea hacia arriba a un valor "bonito" (1, 2, 2.5, 5 × 10^n). */
function niceCeil(n: number): number {
  const exp = Math.pow(10, Math.floor(Math.log10(n)));
  const f = n / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}
