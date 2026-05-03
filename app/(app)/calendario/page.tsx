import Link from "next/link";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { listCalendarEvents, type CalendarEventType } from "@/lib/queries/events";
import { formatDateEs, cn } from "@/lib/utils";
import { CalendarGrid } from "./calendar-grid";

export const dynamic = "force-dynamic";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const eventBadgeVariant: Record<
  CalendarEventType,
  "secondary" | "warning" | "success" | "destructive"
> = {
  vacuna: "secondary",
  vacuna_dosis: "secondary",
  parto_esperado: "warning",
  parto_real: "success",
  enfermedad_inicio: "destructive",
  enfermedad_fin: "success",
};

const eventTypeShort: Record<CalendarEventType, string> = {
  vacuna: "Vacuna",
  vacuna_dosis: "Vacuna",
  parto_esperado: "Parto esperado",
  parto_real: "Parto",
  enfermedad_inicio: "Salud",
  enfermedad_fin: "Salud",
};

function clampMonth(y: number, m: number): { year: number; month: number } {
  let year = y;
  let month = m;
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  return { year, month };
}

export default async function CalendarioPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string; d?: string }>;
}) {
  const sp = await searchParams;
  const now = new Date();
  const yearParam = sp.y ? Number(sp.y) : now.getFullYear();
  const monthParam = sp.m ? Number(sp.m) : now.getMonth() + 1;
  const { year, month } = clampMonth(yearParam, monthParam);

  const events = await listCalendarEvents(year, month);

  // día seleccionado
  let selectedIso: string;
  if (sp.d && /^\d{4}-\d{2}-\d{2}$/.test(sp.d)) {
    selectedIso = sp.d;
  } else if (
    year === now.getFullYear() &&
    month === now.getMonth() + 1
  ) {
    selectedIso = `${year}-${String(month).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  } else {
    selectedIso = `${year}-${String(month).padStart(2, "0")}-01`;
  }

  const dayEvents = events.filter((e) => e.date === selectedIso);

  const prev = clampMonth(year, month - 1);
  const next = clampMonth(year, month + 1);

  const hrefForMonth = (y: number, m: number) =>
    `/calendario?y=${y}&m=${m}`;

  const hrefForDay = (iso: string) =>
    `/calendario?y=${year}&m=${month}&d=${iso}`;

  return (
    <div>
      <PageHeader
        title="Calendario"
        description="Eventos de los animales y la explotación"
      />

      <Card>
        <CardContent className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <Button asChild variant="ghost" size="icon" aria-label="Mes anterior">
              <Link href={hrefForMonth(prev.year, prev.month)} scroll={false}>
                <ChevronLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="font-semibold">
              {MONTHS_ES[month - 1]} {year}
            </div>
            <Button asChild variant="ghost" size="icon" aria-label="Mes siguiente">
              <Link href={hrefForMonth(next.year, next.month)} scroll={false}>
                <ChevronRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          <CalendarGrid
            year={year}
            month={month}
            events={events}
            selectedIso={selectedIso}
            hrefBuilder={hrefForDay}
          />

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-[11px] text-muted-foreground">
            <Legend color="bg-sky-500" label="Vacuna" />
            <Legend color="bg-amber-500" label="Parto esperado" />
            <Legend color="bg-emerald-500" label="Parto" />
            <Legend color="bg-rose-500" label="Salud" />
          </div>
        </CardContent>
      </Card>

      <h2 className="mt-6 mb-2 text-lg font-semibold">
        {formatDateEs(selectedIso)}
      </h2>

      {dayEvents.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title="Sin eventos"
          description="No hay nada registrado para este día."
        />
      ) : (
        <div className="grid gap-2">
          {dayEvents.map((e) => (
            <Card key={e.id}>
              <Link href={e.href} className="block hover:bg-accent/50">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={eventBadgeVariant[e.type]}>
                        {eventTypeShort[e.type]}
                      </Badge>
                      <span className="truncate text-sm font-medium">
                        {e.title}
                      </span>
                    </div>
                    <div className="mt-0.5 truncate text-xs text-muted-foreground">
                      {e.animalKind === "oveja" ? "Oveja" : "Coneja"} ·{" "}
                      {e.animalLabel}
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("inline-block h-2 w-2 rounded-full", color)} />
      {label}
    </span>
  );
}
