import type {
  SheepVaccine,
  RabbitVaccine,
  SheepDisease,
  RabbitDisease,
  Transaction,
} from "@/db/schema";
import type { BreedingWithLambs } from "@/lib/queries/sheep-detail";
import type { BreedingWithLitter } from "@/lib/queries/rabbit-detail";
import type { WeightPoint } from "@/lib/queries/weights";
import { transactionCategoryLabels } from "@/lib/validations";
import { formatEur } from "@/lib/utils";

/**
 * Línea de tiempo del animal: mezcla cronológica (desc) de todo lo que le ha
 * pasado. Se construye en memoria a partir de los datos que la ficha ya
 * carga, así no repetimos consultas.
 */
export type TimelineType =
  | "vaccine"
  | "disease_start"
  | "disease_end"
  | "insemination"
  | "birth"
  | "offspring"
  | "weight"
  | "income"
  | "expense"
  | "born"
  | "status";

export interface TimelineEvent {
  key: string;
  date: string;
  type: TimelineType;
  title: string;
  detail?: string;
  href?: string;
}

interface Base {
  animal: {
    id: number;
    birthDate: string | null;
    status: string;
    deathDate: string | null;
    deathCause: string | null;
  };
  vaccines: (SheepVaccine | RabbitVaccine)[];
  diseases: (SheepDisease | RabbitDisease)[];
  weights: WeightPoint[];
  transactions: Transaction[];
}

export type TimelineInput =
  | (Base & { kind: "oveja"; breedings: BreedingWithLambs[] })
  | (Base & { kind: "coneja"; breedings: BreedingWithLitter[] });

const kg = (n: number) =>
  `${n.toLocaleString("es-ES", { maximumFractionDigits: 2 })} kg`;

const STATUS_LABEL: Record<string, string> = {
  vendido: "Vendida",
  muerto: "Baja: muerte",
  sacrificado: "Baja: sacrificio",
};

export function buildTimeline(input: TimelineInput): TimelineEvent[] {
  const ev: TimelineEvent[] = [];
  const base = input.kind === "oveja" ? "/ovejas" : "/conejas";
  const a = input.animal;

  if (a.birthDate) {
    ev.push({ key: "born", date: a.birthDate, type: "born", title: "Nacimiento" });
  }
  if (a.status !== "activo" && a.deathDate) {
    ev.push({
      key: "status",
      date: a.deathDate,
      type: "status",
      title: STATUS_LABEL[a.status] ?? "Baja",
      detail: a.deathCause ?? undefined,
    });
  }

  for (const v of input.vaccines) {
    ev.push({
      key: `v${v.id}`,
      date: v.date,
      type: "vaccine",
      title: v.type,
      detail: [v.dose, v.vet].filter(Boolean).join(" · ") || undefined,
    });
  }

  for (const d of input.diseases) {
    ev.push({
      key: `d${d.id}`,
      date: d.startDate,
      type: "disease_start",
      title: `Enfermedad: ${d.name}`,
      detail: d.medication ?? d.treatment ?? undefined,
    });
    if (d.resolved && d.resolvedDate) {
      ev.push({
        key: `dr${d.id}`,
        date: d.resolvedDate,
        type: "disease_end",
        title: `Curada: ${d.name}`,
      });
    }
  }

  if (input.kind === "oveja") {
    for (const b of input.breedings) {
      const href = `${base}/${a.id}/crianzas/${b.id}`;
      ev.push({
        key: `i${b.id}`,
        date: b.inseminationDate,
        type: "insemination",
        title: "Inseminación",
        detail: b.sire ? `Semental: ${b.sire}` : undefined,
        href,
      });
      if (b.actualBirthDate) {
        const n = b.lambs.length;
        const males = b.lambs.filter((l) => l.gender === "macho").length;
        const females = b.lambs.filter((l) => l.gender === "hembra").length;
        ev.push({
          key: `b${b.id}`,
          date: b.actualBirthDate,
          type: "birth",
          title: n ? `Parto · ${n} ${n === 1 ? "cordero" : "corderos"}` : "Parto",
          detail:
            males || females
              ? [males && `${males} ${males === 1 ? "macho" : "machos"}`, females && `${females} ${females === 1 ? "hembra" : "hembras"}`]
                  .filter(Boolean)
                  .join(", ")
              : undefined,
          href,
        });
      }
      b.lambs.forEach((l, i) => {
        const name = l.nickname || `Cordero ${i + 1}`;
        if (l.status === "vendido" && l.saleDate) {
          ev.push({
            key: `ls${l.id}`,
            date: l.saleDate,
            type: "offspring",
            title: `${name} vendido`,
            detail: l.salePriceEur ? formatEur(l.salePriceEur) : undefined,
            href,
          });
        } else if (l.status === "sacrificado" && l.slaughterDate) {
          ev.push({
            key: `ls${l.id}`,
            date: l.slaughterDate,
            type: "offspring",
            title: `${name} sacrificado`,
            detail: l.deadWeightKg ? kg(Number(l.deadWeightKg)) : undefined,
            href,
          });
        } else if (l.status === "muerto_natural" && l.slaughterDate) {
          ev.push({
            key: `ls${l.id}`,
            date: l.slaughterDate,
            type: "offspring",
            title: `${name}: muerte natural`,
            href,
          });
        }
      });
    }
  } else {
    for (const b of input.breedings) {
      const href = `${base}/${a.id}/crianzas/${b.id}`;
      ev.push({
        key: `i${b.id}`,
        date: b.inseminationDate,
        type: "insemination",
        title: "Cubrición",
        detail: b.sire ? `Macho: ${b.sire}` : undefined,
        href,
      });
      if (b.actualBirthDate) {
        const n = b.litter?.initialUnits ?? 0;
        ev.push({
          key: `b${b.id}`,
          date: b.actualBirthDate,
          type: "birth",
          title: n ? `Parto · ${n} gazapos` : "Parto",
          href,
        });
      }
      if (b.litter?.slaughterDate) {
        ev.push({
          key: `ls${b.litter.id}`,
          date: b.litter.slaughterDate,
          type: "offspring",
          title: `Matanza · ${b.litter.slaughteredUnits ?? 0} gazapos`,
          detail: b.litter.saleAmountEur ? formatEur(b.litter.saleAmountEur) : undefined,
          href,
        });
      }
    }
  }

  for (const w of input.weights) {
    ev.push({
      key: `w${w.id}`,
      date: w.date,
      type: "weight",
      title: `Pesaje · ${kg(w.weightKg)}`,
      detail: w.notes ?? undefined,
    });
  }

  for (const t of input.transactions) {
    ev.push({
      key: `t${t.id}`,
      date: t.date,
      type: t.type === "ingreso" ? "income" : "expense",
      title: `${transactionCategoryLabels[t.category]} · ${t.type === "ingreso" ? "+" : "−"}${formatEur(t.amountEur)}`,
      detail: t.description ?? undefined,
    });
  }

  return ev.sort((x, y) =>
    x.date === y.date ? y.key.localeCompare(x.key) : y.date.localeCompare(x.date),
  );
}
