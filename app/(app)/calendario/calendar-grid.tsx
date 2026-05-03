import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventType } from "@/lib/queries/events";

const dotColor: Record<CalendarEventType, string> = {
  vacuna: "bg-sky-500",
  vacuna_dosis: "bg-sky-400",
  parto_esperado: "bg-amber-500",
  parto_real: "bg-emerald-500",
  enfermedad_inicio: "bg-rose-500",
  enfermedad_fin: "bg-emerald-400",
};

export function CalendarGrid({
  year,
  month,
  events,
  selectedIso,
  hrefBuilder,
}: {
  year: number;
  month: number; // 1-12
  events: CalendarEvent[];
  selectedIso: string;
  hrefBuilder: (iso: string) => string;
}) {
  const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7; // 0 = lunes
  const lastDay = new Date(year, month, 0).getDate();
  const todayIsoStr = formatDateIso(new Date());

  // index events by date
  const byDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    if (!byDate.has(e.date)) byDate.set(e.date, []);
    byDate.get(e.date)!.push(e);
  }

  const cells: Array<{ iso: string | null; day: number | null }> = [];
  for (let i = 0; i < firstDow; i++) cells.push({ iso: null, day: null });
  for (let d = 1; d <= lastDay; d++) {
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ iso, day: d });
  }
  while (cells.length % 7 !== 0) cells.push({ iso: null, day: null });

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
          <div key={d} className="py-1.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((c, i) => {
          if (c.iso === null) {
            return <div key={i} className="aspect-square" />;
          }
          const dayEvents = byDate.get(c.iso) ?? [];
          const isSelected = c.iso === selectedIso;
          const isToday = c.iso === todayIsoStr;
          const types = unique(dayEvents.map((e) => e.type));
          return (
            <Link
              key={i}
              href={hrefBuilder(c.iso)}
              scroll={false}
              className={cn(
                "flex aspect-square flex-col items-center justify-between rounded-lg border p-1 text-xs transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card hover:bg-accent/50",
                isToday && !isSelected && "border-foreground/40",
              )}
            >
              <span
                className={cn(
                  "self-end text-[11px]",
                  isToday && "font-semibold",
                )}
              >
                {c.day}
              </span>
              <div className="flex min-h-[6px] items-center gap-0.5">
                {types.slice(0, 4).map((t) => (
                  <span
                    key={t}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      dotColor[t],
                    )}
                    aria-hidden
                  />
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function formatDateIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}
