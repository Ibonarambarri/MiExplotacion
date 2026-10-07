import Link from "next/link";
import {
  Baby,
  CalendarDays,
  ChevronRight,
  CircleCheck,
  HeartPulse,
  Rabbit,
  Syringe,
} from "lucide-react";
import { SheepIcon } from "@/components/icons/animal-icons";
import { ListGroup, ListRow, RowIcon } from "@/components/ui/list";
import { Badge } from "@/components/ui/badge";
import { getBalance, getMonthlyBuckets, type MonthBucket } from "@/lib/queries/transactions";
import {
  listActiveDiseases,
  listOverdueVaccines,
  listUpcomingBirths,
  listUpcomingVaccines,
} from "@/lib/queries/events";
import { getHerdKpis } from "@/lib/queries/indicators";
import { getSettings } from "@/lib/settings";
import {
  APP_TIME_ZONE,
  MONTHS_ES,
  MONTHS_ES_SHORT,
  daysUntil,
  nowParts,
  relativeDayLabel,
} from "@/lib/dates";
import { cn, formatEur } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LIST_LIMIT = 5;

function greeting(hour: number): string {
  if (hour >= 6 && hour < 14) return "Buenos días";
  if (hour >= 14 && hour < 21) return "Buenas tardes";
  return "Buenas noches";
}

function longDate(): string {
  const s = new Intl.DateTimeFormat("es-ES", {
    timeZone: APP_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "12 oct" a partir de YYYY-MM-DD. */
function shortDate(iso: string): string {
  const [, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS_ES_SHORT[m - 1]}`;
}

function urgencyVariant(days: number): "destructive" | "warning" | "info" | "secondary" {
  if (days <= 0) return "destructive";
  if (days <= 3) return "warning";
  if (days <= 14) return "info";
  return "secondary";
}

function animalHref(kind: "oveja" | "coneja", id: number) {
  return kind === "oveja" ? `/ovejas/${id}` : `/conejas/${id}`;
}

function plural(n: number, one: string, many: string) {
  return `${n} ${n === 1 ? one : many}`;
}

export default async function InicioPage() {
  const now = nowParts();

  const [
    settings,
    sheepKpis,
    rabbitKpis,
    balance,
    buckets,
    overdue,
    upcomingVaccines,
    births,
    diseases,
  ] = await Promise.all([
    getSettings(),
    getHerdKpis("oveja"),
    getHerdKpis("coneja"),
    getBalance({ year: now.year, month: now.month }),
    getMonthlyBuckets(),
    listOverdueVaccines(),
    listUpcomingVaccines(30),
    listUpcomingBirths(30),
    listActiveDiseases(),
  ]);

  const vaccines = [...overdue, ...upcomingVaccines];
  const soonVaccines = upcomingVaccines.filter((v) => daysUntil(v.nextDoseDate) <= 3);
  const weekBirths = births.filter((b) => daysUntil(b.expectedBirthDate) <= 7);

  const todayItems: {
    key: string;
    href: string;
    tone: "destructive" | "warning" | "harvest";
    icon: React.ReactNode;
    title: string;
    subtitle: string;
  }[] = [];
  if (overdue.length) {
    todayItems.push({
      key: "overdue",
      href: "#vacunas",
      tone: "destructive",
      icon: <Syringe />,
      title: plural(overdue.length, "vacuna vencida", "vacunas vencidas"),
      subtitle: overdue
        .slice(0, 2)
        .map((v) => v.animalLabel)
        .join(", "),
    });
  }
  if (soonVaccines.length) {
    todayItems.push({
      key: "soon",
      href: "#vacunas",
      tone: "warning",
      icon: <Syringe />,
      title: plural(soonVaccines.length, "vacuna en 3 días", "vacunas en 3 días"),
      subtitle: soonVaccines
        .slice(0, 2)
        .map((v) => `${v.type} · ${relativeDayLabel(daysUntil(v.nextDoseDate))}`)
        .join(", "),
    });
  }
  if (weekBirths.length) {
    todayItems.push({
      key: "births",
      href: "#partos",
      tone: "harvest",
      icon: <Baby />,
      title: plural(weekBirths.length, "parto esta semana", "partos esta semana"),
      subtitle: weekBirths
        .slice(0, 2)
        .map((b) => `${b.animalLabel} · ${relativeDayLabel(daysUntil(b.expectedBirthDate))}`)
        .join(", "),
    });
  }
  if (diseases.length) {
    todayItems.push({
      key: "diseases",
      href: "#tratamientos",
      tone: "destructive",
      icon: <HeartPulse />,
      title: plural(diseases.length, "animal en tratamiento", "animales en tratamiento"),
      subtitle: diseases
        .slice(0, 2)
        .map((d) => d.name)
        .join(", "),
    });
  }

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <header className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[15px] font-medium text-muted-foreground">{longDate()}</p>
          <h1 className="text-balance text-[32px] font-bold leading-[1.1] tracking-tight">
            {greeting(now.hour)}
          </h1>
          <p className="mt-1 truncate text-[15px] text-muted-foreground">
            {settings.farmName}
          </p>
        </div>
        <Link
          href="/calendario"
          aria-label="Abrir calendario"
          className="pressable flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-card text-primary shadow-[0_1px_2px_rgb(0_0_0/0.06)] ring-1 ring-border/60 active:bg-accent"
        >
          <CalendarDays className="h-5 w-5" aria-hidden />
        </Link>
      </header>

      {/* Hoy */}
      <section
        aria-labelledby="hoy-title"
        className={cn(
          "overflow-hidden rounded-3xl border shadow-[0_1px_2px_rgb(0_0_0/0.04)]",
          todayItems.length
            ? "border-harvest/25 bg-harvest-soft/60"
            : "border-success/20 bg-success-soft/60",
        )}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 id="hoy-title" className="text-lg font-semibold tracking-tight">
            Hoy
          </h2>
          {todayItems.length > 0 && (
            <Badge variant="harvest" className="bg-card/80">
              {plural(todayItems.length, "aviso", "avisos")}
            </Badge>
          )}
        </div>
        {todayItems.length === 0 ? (
          <div className="flex items-center gap-3 px-4 pt-2 pb-4">
            <RowIcon tone="success" className="bg-card/80">
              <CircleCheck />
            </RowIcon>
            <div>
              <p className="font-semibold">Todo en orden</p>
              <p className="text-sm text-muted-foreground">
                Sin vacunas urgentes, partos cercanos ni tratamientos.
              </p>
            </div>
          </div>
        ) : (
          <ul className="px-2 pt-1 pb-2">
            {todayItems.map((item) => (
              <li key={item.key}>
                <a
                  href={item.href}
                  className="pressable flex min-h-14 items-center gap-3 rounded-2xl px-2 py-2 active:bg-card/60"
                >
                  <RowIcon tone={item.tone} className="bg-card/90">
                    {item.icon}
                  </RowIcon>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="block truncate text-[13px] text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Bento */}
      <div className="grid grid-cols-2 gap-3">
        <HerdTile
          href="/ovejas"
          label="Ovejas"
          icon={<SheepIcon />}
          tone="primary"
          active={sheepKpis.active}
          pregnant={sheepKpis.pregnant}
        />
        <HerdTile
          href="/conejas"
          label="Conejas"
          icon={<Rabbit />}
          tone="harvest"
          active={rabbitKpis.active}
          pregnant={rabbitKpis.pregnant}
        />
        <BalanceTile
          monthName={MONTHS_ES[now.month - 1]}
          balance={balance.balance}
          ingresos={balance.ingresos}
          gastos={balance.gastos}
          buckets={buckets.slice(-6)}
        />
      </div>

      {/* Listas */}
      <ListGroup
        title={<span id="vacunas" className="scroll-mt-6">Próximas vacunas</span>}
        action={<SeeAll href="/calendario?vista=agenda" />}
        footer={
          vaccines.length > LIST_LIMIT
            ? `Y ${vaccines.length - LIST_LIMIT} más en los próximos 30 días`
            : undefined
        }
      >
        {vaccines.length === 0 ? (
          <EmptyRow text="Ninguna vacuna en los próximos 30 días." />
        ) : (
          vaccines.slice(0, LIST_LIMIT).map((v) => {
            const d = daysUntil(v.nextDoseDate);
            return (
              <ListRow
                key={`${v.animalKind}-${v.id}`}
                href={animalHref(v.animalKind, v.animalId)}
                leading={
                  <RowIcon tone={d < 0 ? "destructive" : "info"}>
                    <Syringe />
                  </RowIcon>
                }
                title={v.type}
                subtitle={`${v.animalLabel} · ${shortDate(v.nextDoseDate)}`}
                trailing={
                  <Badge variant={urgencyVariant(d)}>
                    {d < 0 ? `Vencida ${-d}d` : relativeDayLabel(d)}
                  </Badge>
                }
              />
            );
          })
        )}
      </ListGroup>

      <ListGroup
        title={<span id="partos" className="scroll-mt-6">Partos esperados</span>}
        footer={
          births.length > LIST_LIMIT
            ? `Y ${births.length - LIST_LIMIT} más en los próximos 30 días`
            : undefined
        }
      >
        {births.length === 0 ? (
          <EmptyRow text="Ningún parto previsto en los próximos 30 días." />
        ) : (
          births.slice(0, LIST_LIMIT).map((b) => {
            const d = daysUntil(b.expectedBirthDate);
            return (
              <ListRow
                key={`${b.animalKind}-${b.id}`}
                href={`${animalHref(b.animalKind, b.animalId)}/crianzas/${b.id}`}
                leading={
                  <RowIcon tone="harvest">
                    {b.animalKind === "oveja" ? <SheepIcon /> : <Rabbit />}
                  </RowIcon>
                }
                title={b.animalLabel}
                subtitle={`${b.animalKind === "oveja" ? "Oveja" : "Coneja"} · ${shortDate(b.expectedBirthDate)}`}
                trailing={<Badge variant={urgencyVariant(d)}>{relativeDayLabel(d)}</Badge>}
              />
            );
          })
        )}
      </ListGroup>

      <ListGroup
        title={<span id="tratamientos" className="scroll-mt-6">En tratamiento</span>}
        footer={
          diseases.length > LIST_LIMIT ? `Y ${diseases.length - LIST_LIMIT} más` : undefined
        }
      >
        {diseases.length === 0 ? (
          <EmptyRow text="Ningún animal en tratamiento." />
        ) : (
          diseases.slice(0, LIST_LIMIT).map((d) => {
            const since = -daysUntil(d.startDate);
            return (
              <ListRow
                key={`${d.animalKind}-${d.id}`}
                href={animalHref(d.animalKind, d.animalId)}
                leading={
                  <RowIcon tone="destructive">
                    <HeartPulse />
                  </RowIcon>
                }
                title={d.name}
                subtitle={d.animalLabel}
                trailing={
                  <span className="tabular text-[13px] text-muted-foreground">
                    {since <= 0 ? "Desde hoy" : `${since} ${since === 1 ? "día" : "días"}`}
                  </span>
                }
              />
            );
          })
        )}
      </ListGroup>
    </div>
  );
}

function SeeAll({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="-my-2 inline-flex min-h-11 items-center px-1 text-[15px] font-medium text-primary active:opacity-60"
    >
      Ver agenda
    </Link>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <li className="flex min-h-14 items-center px-4 py-3 text-[15px] text-muted-foreground">
      {text}
    </li>
  );
}

function HerdTile({
  href,
  label,
  icon,
  tone,
  active,
  pregnant,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  tone: "primary" | "harvest";
  active: number;
  pregnant: number;
}) {
  return (
    <Link
      href={href}
      className="pressable flex flex-col gap-3 rounded-3xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] active:bg-accent/60"
    >
      <div className="flex items-center justify-between">
        <RowIcon tone={tone}>{icon}</RowIcon>
        <ChevronRight className="h-4 w-4 text-muted-foreground/60" aria-hidden />
      </div>
      <div>
        <div className="tabular text-[28px] font-bold leading-none tracking-tight">
          {active}
        </div>
        <div className="mt-1 text-[13px] font-medium text-muted-foreground">
          {label} {active === 1 ? "activa" : "activas"}
        </div>
      </div>
      <div
        className={cn(
          "tabular inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          pregnant > 0 ? "bg-harvest-soft text-harvest" : "bg-muted text-muted-foreground",
        )}
      >
        {plural(pregnant, "gestante", "gestantes")}
      </div>
    </Link>
  );
}

function BalanceTile({
  monthName,
  balance,
  ingresos,
  gastos,
  buckets,
}: {
  monthName: string;
  balance: number;
  ingresos: number;
  gastos: number;
  buckets: MonthBucket[];
}) {
  const positive = balance >= 0;
  return (
    <Link
      href="/finanzas"
      className="pressable col-span-2 flex items-stretch justify-between gap-4 rounded-3xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)] active:bg-accent/60"
    >
      <div className="min-w-0 space-y-2">
        <div className="text-[13px] font-medium text-muted-foreground">
          Balance de {monthName}
        </div>
        <div
          className={cn(
            "tabular truncate text-[28px] font-bold leading-none tracking-tight",
            positive ? "text-success" : "text-destructive",
          )}
        >
          {positive ? "+" : "−"}
          {formatEur(Math.abs(balance))}
        </div>
        <div className="tabular flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          <span>
            <span className="text-chart-income">●</span> {formatEur(ingresos)}
          </span>
          <span>
            <span className="text-chart-expense">●</span> {formatEur(gastos)}
          </span>
        </div>
      </div>
      <Sparkline buckets={buckets} />
    </Link>
  );
}

/** Barras divergentes del balance neto de los últimos meses. */
function Sparkline({ buckets }: { buckets: MonthBucket[] }) {
  const W = 120;
  const H = 64;
  const LABEL = 12;
  const chartH = H - LABEL;
  const nets = buckets.map((b) => b.ingresos - b.gastos);
  const max = Math.max(1, ...nets.map((n) => Math.abs(n)));
  const hasNeg = nets.some((n) => n < 0);
  const hasPos = nets.some((n) => n > 0);
  // Línea base: centrada si hay positivos y negativos; abajo/arriba si no.
  const baseY = hasNeg && hasPos ? chartH / 2 : hasNeg ? 2 : chartH - 2;
  const scale = hasNeg && hasPos ? chartH / 2 - 2 : chartH - 4;
  const slot = W / Math.max(1, buckets.length);
  const barW = Math.min(12, slot * 0.55);
  const label = buckets
    .map((b, i) => `${MONTHS_ES_SHORT[b.month - 1]}: ${formatEur(nets[i])}`)
    .join(", ");

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      role="img"
      aria-label={`Balance de los últimos meses. ${label}`}
      className="shrink-0 self-center"
    >
      <line x1={0} x2={W} y1={baseY} y2={baseY} className="stroke-border" strokeWidth={1} />
      {nets.map((n, i) => {
        const h = Math.max(n === 0 ? 0 : 2, (Math.abs(n) / max) * scale);
        const x = i * slot + (slot - barW) / 2;
        const y = n >= 0 ? baseY - h : baseY;
        const last = i === nets.length - 1;
        return (
          <g key={`${buckets[i].year}-${buckets[i].month}`}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx={2}
              className={cn(
                n >= 0 ? "fill-chart-income" : "fill-chart-expense",
                !last && "opacity-45",
              )}
            />
            <text
              x={x + barW / 2}
              y={H - 1}
              textAnchor="middle"
              className={cn(
                "fill-muted-foreground text-[9px]",
                last && "fill-foreground font-semibold",
              )}
            >
              {MONTHS_ES_SHORT[buckets[i].month - 1].charAt(0).toUpperCase()}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
