"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Baby,
  Cake,
  Flag,
  Heart,
  HeartPulse,
  Scale,
  ShieldCheck,
  Syringe,
  Tag,
  TrendingDown,
  TrendingUp,
  History,
} from "lucide-react";
import { RowIcon } from "@/components/ui/list";
import { EmptyState } from "@/components/empty-state";
import { MONTHS_ES, MONTHS_ES_SHORT, daysUntil, relativeDayLabel } from "@/lib/dates";
import type { TimelineEvent, TimelineType } from "@/lib/queries/timeline";
import { cn } from "@/lib/utils";

type Tone = React.ComponentProps<typeof RowIcon>["tone"];

const STYLE: Record<TimelineType, { icon: React.ComponentType<{ className?: string }>; tone: Tone }> = {
  vaccine: { icon: Syringe, tone: "info" },
  disease_start: { icon: HeartPulse, tone: "warning" },
  disease_end: { icon: ShieldCheck, tone: "success" },
  insemination: { icon: Heart, tone: "harvest" },
  birth: { icon: Baby, tone: "harvest" },
  offspring: { icon: Tag, tone: "primary" },
  weight: { icon: Scale, tone: "muted" },
  income: { icon: TrendingUp, tone: "success" },
  expense: { icon: TrendingDown, tone: "destructive" },
  born: { icon: Cake, tone: "primary" },
  status: { icon: Flag, tone: "muted" },
};

const PAGE = 25;

function whenLabel(iso: string) {
  const d = daysUntil(iso);
  if (Math.abs(d) <= 14) return relativeDayLabel(d);
  const [, m, day] = iso.split("-").map(Number);
  return `${day} ${MONTHS_ES_SHORT[m - 1]}`;
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  const [limit, setLimit] = useState(PAGE);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<History className="h-6 w-6" />}
        title="Sin historial todavía"
        description="Aquí aparecerán vacunas, partos, pesajes y movimientos según los vayas apuntando."
      />
    );
  }

  const shown = events.slice(0, limit);
  const groups: { key: string; label: string; items: TimelineEvent[] }[] = [];
  for (const e of shown) {
    const key = e.date.slice(0, 7);
    const last = groups.at(-1);
    if (last?.key === key) last.items.push(e);
    else {
      const [y, m] = key.split("-").map(Number);
      groups.push({ key, label: `${MONTHS_ES[m - 1]} ${y}`, items: [e] });
    }
  }

  return (
    <div className="space-y-5">
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <h3 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            {g.label}
          </h3>
          <ol className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
            {g.items.map((e, i) => {
              const s = STYLE[e.type];
              const Icon = s.icon;
              const body = (
                <>
                  <span className="relative z-10 shrink-0">
                    <RowIcon tone={s.tone}>
                      <Icon />
                    </RowIcon>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium leading-snug">
                      {e.title}
                    </span>
                    {e.detail && (
                      <span className="mt-0.5 block truncate text-[13px] text-muted-foreground">
                        {e.detail}
                      </span>
                    )}
                  </span>
                  <time
                    dateTime={e.date}
                    className="tabular shrink-0 text-xs text-muted-foreground"
                  >
                    {whenLabel(e.date)}
                  </time>
                </>
              );
              const cls = cn(
                "relative flex min-h-14 items-center gap-3 px-4 py-2.5",
                i > 0 && "border-t border-border/60",
              );
              return (
                <li key={e.key} className="relative">
                  {/* Hilo vertical entre iconos */}
                  {g.items.length > 1 && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute left-[2.12rem] w-px bg-border",
                        i === 0 ? "top-1/2 bottom-0" : i === g.items.length - 1 ? "top-0 h-1/2" : "inset-y-0",
                      )}
                    />
                  )}
                  {e.href ? (
                    <Link href={e.href} className={cn(cls, "pressable active:bg-accent/70")}>
                      {body}
                    </Link>
                  ) : (
                    <div className={cls}>{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
      {events.length > limit && (
        <button
          type="button"
          onClick={() => setLimit((l) => l + PAGE)}
          className="pressable h-11 w-full rounded-xl text-sm font-semibold text-primary"
        >
          Ver más ({events.length - limit})
        </button>
      )}
    </div>
  );
}
