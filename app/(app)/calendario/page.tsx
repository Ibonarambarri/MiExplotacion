import Link from "next/link";
import {
  Baby,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Syringe,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { ListGroup, ListRow, RowIcon } from "@/components/ui/list";
import {
  listAgendaEvents,
  listCalendarEvents,
  type CalendarEvent,
  type CalendarEventType,
} from "@/lib/queries/events";
import { MONTHS_ES, daysBetweenIso, nowParts, relativeDayLabel } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { CalendarGrid, EVENT_DOT } from "./calendar-grid";
import { ViewSwitch } from "./view-switch";

export const dynamic = "force-dynamic";

export const metadata = { title: "Calendario" };

const AGENDA_DAYS = 60;

const EVENT_STYLE: Record<
  CalendarEventType,
  { tone: "info" | "harvest" | "success" | "destructive" | "muted"; icon: React.ReactNode; label: string }
> = {
  vacuna: { tone: "info", icon: <Syringe />, label: "Vacuna" },
  vacuna_dosis: { tone: "info", icon: <Syringe />, label: "Próxima dosis" },
  parto_esperado: { tone: "harvest", icon: <Baby />, label: "Parto esperado" },
  parto_real: { tone: "success", icon: <Baby />, label: "Parto" },
  enfermedad_inicio: { tone: "destructive", icon: <HeartPulse />, label: "Salud" },
  enfermedad_fin: { tone: "muted", icon: <HeartPulse />, label: "Salud" },
};

const LEGEND: { type: CalendarEventType; label: string }[] = [
  { type: "vacuna", label: "Vacuna" },
  { type: "parto_esperado", label: "Parto esperado" },
  { type: "parto_real", label: "Parto" },
  { type: "enfermedad_inicio", label: "Salud" },
];

function clampMonth(y: number, m: number): { year: number; month: number } {
  const idx = y * 12 + (m - 1);
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

function isoOf(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** "Miércoles, 7 de octubre" a partir de YYYY-MM-DD (sin depender de la TZ). */
function longDateEs(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const s = new Intl.DateTimeFormat("es-ES", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date(Date.UTC(y, m - 1, d)));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; d?: string; vista?: string }>;
}) {
  const sp = await searchParams;
  const now = nowParts();
  const today = isoOf(now.year, now.month, now.day);
  const vista = sp.vista === "agenda" ? "agenda" : "mes";

  const yParam = Number(sp.y);
  const mParam = Number(sp.m);
  const { year, month } = clampMonth(
    Number.isInteger(yParam) && yParam > 1900 ? yParam : now.year,
    Number.isInteger(mParam) && mParam !== 0 ? mParam : now.month,
  );
  const monthHref = `/calendario?y=${year}&m=${month}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Calendario"
        back={{ href: "/", label: "Inicio" }}
        className="pb-0"
      />
      <ViewSwitch value={vista} monthHref={monthHref} />
      {vista === "agenda" ? (
        <AgendaView today={today} />
      ) : (
        <MonthView
          year={year}
          month={month}
          today={today}
          selectedParam={sp.d}
          isCurrentMonth={year === now.year && month === now.month}
        />
      )}
    </div>
  );
}

async function MonthView({
  year,
  month,
  today,
  selectedParam,
  isCurrentMonth,
}: {
  year: number;
  month: number;
  today: string;
  selectedParam?: string;
  isCurrentMonth: boolean;
}) {
  const events = await listCalendarEvents(year, month);
  const monthPrefix = isoOf(year, month, 1).slice(0, 8);

  const selectedIso =
    selectedParam && /^\d{4}-\d{2}-\d{2}$/.test(selectedParam) && selectedParam.startsWith(monthPrefix)
      ? selectedParam
      : isCurrentMonth
        ? today
        : isoOf(year, month, 1);

  const dayEvents = events.filter((e) => e.date === selectedIso);
  const prev = clampMonth(year, month - 1);
  const next = clampMonth(year, month + 1);
  const monthName = MONTHS_ES[month - 1];

  return (
    <>
      <section className="rounded-3xl border border-border/60 bg-card p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
        <div className="mb-2 flex items-center justify-between">
          <MonthArrow
            href={`/calendario?y=${prev.year}&m=${prev.month}`}
            label={`Ir a ${MONTHS_ES[prev.month - 1]}`}
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </MonthArrow>
          <div className="flex flex-col items-center">
            <h2 className="text-[17px] font-semibold capitalize" aria-live="polite">
              {monthName} <span className="tabular text-muted-foreground">{year}</span>
            </h2>
            {!isCurrentMonth && (
              <Link
                href="/calendario"
                replace
                scroll={false}
                className="text-xs font-medium text-primary active:opacity-60"
              >
                Volver a hoy
              </Link>
            )}
          </div>
          <MonthArrow
            href={`/calendario?y=${next.year}&m=${next.month}`}
            label={`Ir a ${MONTHS_ES[next.month - 1]}`}
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </MonthArrow>
        </div>

        <CalendarGrid
          year={year}
          month={month}
          events={events}
          selectedIso={selectedIso}
          todayIso={today}
          hrefBuilder={(iso) => `/calendario?y=${year}&m=${month}&d=${iso}`}
        />

        <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-border/60 px-1 pt-2.5 text-xs text-muted-foreground">
          {LEGEND.map((l) => (
            <span key={l.type} className="inline-flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", EVENT_DOT[l.type])} aria-hidden />
              {l.label}
            </span>
          ))}
        </div>
      </section>

      {dayEvents.length === 0 ? (
        <section className="space-y-2">
          <DayTitle iso={selectedIso} today={today} />
          <EmptyState
            icon={<CalendarDays />}
            title="Día tranquilo"
            description="No hay vacunas, partos ni incidencias este día."
            className="py-8"
          />
        </section>
      ) : (
        <ListGroup title={<DayTitleText iso={selectedIso} today={today} />}>
          {dayEvents.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ListGroup>
      )}
    </>
  );
}

async function AgendaView({ today }: { today: string }) {
  const events = await listAgendaEvents(AGENDA_DAYS);

  if (events.length === 0) {
    return (
      <EmptyState
        icon={<CalendarDays />}
        title="Agenda despejada"
        description={`No hay vacunas ni partos previstos en los próximos ${AGENDA_DAYS} días.`}
      />
    );
  }

  const groups = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = groups.get(e.date) ?? [];
    list.push(e);
    groups.set(e.date, list);
  }

  return (
    <div className="space-y-5">
      {[...groups.entries()].map(([date, list]) => (
        <ListGroup key={date} title={<DayTitleText iso={date} today={today} />}>
          {list.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </ListGroup>
      ))}
      <p className="px-1 text-center text-xs text-muted-foreground">
        Mostrando los próximos {AGENDA_DAYS} días
      </p>
    </div>
  );
}

function MonthArrow({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      replace
      scroll={false}
      aria-label={label}
      className="pressable flex h-11 w-11 items-center justify-center rounded-full text-primary active:bg-accent"
    >
      {children}
    </Link>
  );
}

function DayTitleText({ iso, today }: { iso: string; today: string }) {
  const diff = daysBetweenIso(today, iso);
  const rel = Math.abs(diff) <= 1 ? relativeDayLabel(diff) : null;
  return (
    <>
      {rel ? `${rel} · ` : ""}
      {longDateEs(iso)}
    </>
  );
}

function DayTitle({ iso, today }: { iso: string; today: string }) {
  return (
    <h2 className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
      <DayTitleText iso={iso} today={today} />
    </h2>
  );
}

function EventRow({ event: e }: { event: CalendarEvent }) {
  const style = EVENT_STYLE[e.type];
  return (
    <ListRow
      href={e.href}
      leading={<RowIcon tone={style.tone}>{style.icon}</RowIcon>}
      title={e.title}
      subtitle={`${e.animalKind === "oveja" ? "Oveja" : "Coneja"} · ${e.animalLabel}`}
    />
  );
}
