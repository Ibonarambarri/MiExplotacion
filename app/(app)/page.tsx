import Link from "next/link";
import {
  Syringe,
  Baby,
  HeartPulse,
  Wallet,
  CalendarDays,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateEs, formatEur } from "@/lib/utils";
import { getBalance } from "@/lib/queries/transactions";
import {
  listUpcomingVaccines,
  listUpcomingBirths,
  listActiveDiseases,
} from "@/lib/queries/events";
import { todayIso } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function daysUntil(iso: string): number {
  const today = todayIso();
  const [y1, m1, d1] = today.split("-").map(Number);
  const [y2, m2, d2] = iso.split("-").map(Number);
  const a = Date.UTC(y1, m1 - 1, d1);
  const b = Date.UTC(y2, m2 - 1, d2);
  return Math.round((b - a) / 86_400_000);
}

function urgencyVariant(days: number): "destructive" | "warning" | "secondary" {
  if (days <= 3) return "destructive";
  if (days <= 14) return "warning";
  return "secondary";
}

function urgencyLabel(days: number): string {
  if (days === 0) return "Hoy";
  if (days === 1) return "Mañana";
  return `En ${days}d`;
}

export default async function DashboardPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const [vaccines, births, diseases, balance] = await Promise.all([
    listUpcomingVaccines(30),
    listUpcomingBirths(30),
    listActiveDiseases(),
    getBalance({ year, month }),
  ]);

  return (
    <div>
      <PageHeader
        title="Inicio"
        description={`Hoy, ${formatDateEs(new Date())}`}
        action={
          <Button asChild variant="ghost" size="sm">
            <Link href="/calendario">
              <CalendarDays className="h-4 w-4" />
              Calendario
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3">
        {/* Balance del mes */}
        <Link href="/finanzas" className="block">
          <Card className="transition-colors hover:bg-accent/50">
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Wallet className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Balance · {MONTHS_ES[month - 1]}
                  </div>
                  <div
                    className={cn(
                      "font-mono text-xl font-semibold",
                      balance.balance >= 0
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-destructive",
                    )}
                  >
                    {balance.balance >= 0 ? "+" : "−"}
                    {formatEur(Math.abs(balance.balance))}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>

        {/* Vacunas próximas */}
        <SectionCard
          icon={<Syringe className="h-5 w-5" />}
          title="Vacunas próximas"
          empty="No hay vacunas pendientes en los próximos 30 días."
          count={vaccines.length}
        >
          {vaccines.slice(0, 5).map((v) => {
            const d = daysUntil(v.nextDoseDate);
            return (
              <EventRow
                key={v.id + v.animalKind}
                href={
                  v.animalKind === "oveja"
                    ? `/ovejas/${v.animalId}`
                    : `/conejas/${v.animalId}`
                }
                title={v.type}
                subtitle={`${v.animalLabel} · ${formatDateEs(v.nextDoseDate)}`}
                badge={
                  <Badge variant={urgencyVariant(d)}>{urgencyLabel(d)}</Badge>
                }
              />
            );
          })}
        </SectionCard>

        {/* Partos esperados */}
        <SectionCard
          icon={<Baby className="h-5 w-5" />}
          title="Partos esperados"
          empty="Sin partos en los próximos 30 días."
          count={births.length}
        >
          {births.slice(0, 5).map((b) => {
            const d = daysUntil(b.expectedBirthDate);
            const base =
              b.animalKind === "oveja"
                ? `/ovejas/${b.animalId}/crianzas/${b.id}`
                : `/conejas/${b.animalId}/crianzas/${b.id}`;
            return (
              <EventRow
                key={b.id + b.animalKind}
                href={base}
                title={b.animalLabel}
                subtitle={`${b.animalKind === "oveja" ? "Oveja" : "Coneja"} · ${formatDateEs(b.expectedBirthDate)}`}
                badge={
                  <Badge variant={urgencyVariant(d)}>{urgencyLabel(d)}</Badge>
                }
              />
            );
          })}
        </SectionCard>

        {/* Tratamientos activos */}
        <SectionCard
          icon={<HeartPulse className="h-5 w-5" />}
          title="En tratamiento"
          empty="No hay enfermedades activas."
          count={diseases.length}
        >
          {diseases.slice(0, 5).map((d) => (
            <EventRow
              key={d.id + d.animalKind}
              href={
                d.animalKind === "oveja"
                  ? `/ovejas/${d.animalId}`
                  : `/conejas/${d.animalId}`
              }
              title={d.name}
              subtitle={`${d.animalLabel} · desde ${formatDateEs(d.startDate)}`}
              badge={<Badge variant="warning">Activa</Badge>}
            />
          ))}
        </SectionCard>
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  empty,
  count,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="space-y-2 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
            <h2 className="font-semibold">{title}</h2>
          </div>
          {count > 0 && (
            <Badge variant="secondary">{count}</Badge>
          )}
        </div>
        {count === 0 ? (
          <p className="pl-11 text-sm text-muted-foreground">{empty}</p>
        ) : (
          <div className="grid gap-1.5">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

function EventRow({
  href,
  title,
  subtitle,
  badge,
}: {
  href: string;
  title: string;
  subtitle: string;
  badge: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-accent/50"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <div className="shrink-0">{badge}</div>
    </Link>
  );
}
