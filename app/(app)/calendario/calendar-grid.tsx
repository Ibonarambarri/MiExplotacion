import Link from "next/link";
import { cn } from "@/lib/utils";
import type { CalendarEvent, CalendarEventType } from "@/lib/queries/events";

/** Color del punto por tipo de evento (tokens semánticos). */
export const EVENT_DOT: Record<CalendarEventType, string> = {
  vacuna: "bg-info",
  vacuna_dosis: "bg-info",
  parto_esperado: "bg-harvest",
  parto_real: "bg-success",
  enfermedad_inicio: "bg-destructive",
  enfermedad_fin: "bg-destructive/50",
};

const WEEKDAYS = [
  { short: "L", long: "lunes" },
  { short: "M", long: "martes" },
  { short: "X", long: "miércoles" },
  { short: "J", long: "jueves" },
  { short: "V", long: "viernes" },
  { short: "S", long: "sábado" },
  { short: "D", long: "domingo" },
];

export function CalendarGrid({
  year,
  month,
  events,
  selectedIso,
  todayIso,
  hrefBuilder,
}: {
  year: number;
  month: number; // 1-12
  events: CalendarEvent[];
  selectedIso: string;
  todayIso: string;
  hrefBuilder: (iso: string) => string;
}) {
  // Cálculos en UTC: no dependen de la zona horaria del servidor.
  const firstDow = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // 0 = lunes
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

  const byDate = new Map<string, CalendarEventType[]>();
  for (const e of events) {
    const list = byDate.get(e.date) ?? [];
    if (!list.some((t) => EVENT_DOT[t] === EVENT_DOT[e.type])) list.push(e.type);
    byDate.set(e.date, list);
  }

  const cells: Array<{ iso: string; day: number } | null> = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= lastDay; d++) {
    cells.push({
      iso: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      day: d,
    });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div>
      <div className="grid grid-cols-7 pb-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <abbr key={d.long} title={d.long} className="py-1 no-underline">
            {d.short}
          </abbr>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((c, i) => {
          if (!c) return <div key={i} aria-hidden className="h-12" />;
          const types = byDate.get(c.iso) ?? [];
          const isSelected = c.iso === selectedIso;
          const isToday = c.iso === todayIso;
          return (
            <Link
              key={c.iso}
              href={hrefBuilder(c.iso)}
              scroll={false}
              replace
              aria-current={isSelected ? "date" : undefined}
              aria-label={`${c.day}${isToday ? ", hoy" : ""}${types.length ? `, ${types.length === 1 ? "1 tipo de evento" : `${types.length} tipos de evento`}` : ""}`}
              className="group flex h-12 flex-col items-center justify-start gap-1 pt-0.5 [-webkit-tap-highlight-color:transparent]"
            >
              <span
                className={cn(
                  "tabular flex h-8 w-8 items-center justify-center rounded-full text-[15px] transition-[background-color,color,transform] duration-150 group-active:scale-90",
                  isSelected
                    ? "bg-primary font-semibold text-primary-foreground"
                    : isToday
                      ? "font-semibold text-primary ring-2 ring-primary ring-inset"
                      : "text-foreground group-active:bg-accent",
                )}
              >
                {c.day}
              </span>
              <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                {types.slice(0, 3).map((t) => (
                  <span key={t} className={cn("h-1.5 w-1.5 rounded-full", EVENT_DOT[t])} />
                ))}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
