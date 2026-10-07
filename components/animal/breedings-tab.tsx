"use client";

import { useState } from "react";
import { Baby, Heart, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListGroup, ListRow, RowIcon } from "@/components/ui/list";
import { AnimalAvatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";
import { BreedingFormDialog } from "@/components/animal/breeding-form-dialog";
import { createSheepBreedingAction } from "@/actions/sheep-breedings";
import { createRabbitBreedingAction } from "@/actions/rabbit-breedings";
import { ageLabel, daysUntil } from "@/lib/dates";
import { formatDateEs } from "@/lib/utils";
import type { BreedingWithLambs } from "@/lib/queries/sheep-detail";
import type { BreedingWithLitter } from "@/lib/queries/rabbit-detail";
import type { AnimalListItem } from "@/lib/queries/sheep";

type Props =
  | { kind: "oveja"; breedings: BreedingWithLambs[] }
  | { kind: "coneja"; breedings: BreedingWithLitter[] };

export function BreedingsTab({
  animalId,
  gestationDays,
  daughters,
  ...props
}: Props & {
  animalId: number;
  gestationDays: number;
  daughters: AnimalListItem[];
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const isSheep = props.kind === "oveja";
  const base = isSheep ? "/ovejas" : "/conejas";
  const createAction = isSheep
    ? createSheepBreedingAction.bind(null, animalId)
    : createRabbitBreedingAction.bind(null, animalId);

  const rows = props.breedings.map((b) => {
    const open = !b.actualBirthDate;
    let subtitle: string;
    if (props.kind === "oveja") {
      const lambs = (b as BreedingWithLambs).lambs;
      const alive = lambs.filter((l) => l.status === "vivo").length;
      subtitle = open
        ? `${isSheep ? "Inseminación" : "Cubrición"} ${formatDateEs(b.inseminationDate)}`
        : lambs.length
          ? `${lambs.length} ${lambs.length === 1 ? "cordero" : "corderos"} · ${alive} ${alive === 1 ? "vivo" : "vivos"}`
          : "Sin corderos apuntados";
    } else {
      const litter = (b as BreedingWithLitter).litter;
      subtitle = open
        ? `Cubrición ${formatDateEs(b.inseminationDate)}`
        : litter
          ? `${litter.initialUnits} gazapos · ${litter.currentUnits} vivos${litter.slaughterDate ? " · matanza" : ""}`
          : "Sin camada apuntada";
    }
    if (b.sire) subtitle += ` · ${isSheep ? "Semental" : "Macho"}: ${b.sire}`;
    const d = open ? daysUntil(b.expectedBirthDate) : null;
    return (
      <ListRow
        key={b.id}
        href={`${base}/${animalId}/crianzas/${b.id}`}
        leading={
          <RowIcon tone="harvest">{open ? <Heart /> : <Baby />}</RowIcon>
        }
        title={
          <span className="tabular">
            {open
              ? `Parto previsto ${formatDateEs(b.expectedBirthDate)}`
              : `Parto ${formatDateEs(b.actualBirthDate)}`}
          </span>
        }
        subtitle={<span className="tabular">{subtitle}</span>}
        trailing={
          d !== null ? (
            <Badge variant="harvest">
              {d > 0 ? `En ${d}d` : d === 0 ? "Hoy" : `Atrasado ${-d}d`}
            </Badge>
          ) : undefined
        }
      />
    );
  });

  return (
    <div className="space-y-6">
      {props.breedings.length === 0 ? (
        <EmptyState
          icon={<Baby className="h-6 w-6" />}
          title="Sin crianzas"
          description={`Apunta una ${isSheep ? "inseminación" : "cubrición"} y calcularemos el parto previsto (+${gestationDays} días).`}
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Nueva crianza
            </Button>
          }
        />
      ) : (
        <ListGroup
          title="Crianzas"
          action={
            <Button size="sm" variant="ghost" className="-my-2 -mr-2 h-11 text-primary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Nueva
            </Button>
          }
        >
          {rows}
        </ListGroup>
      )}

      {daughters.length > 0 && (
        <ListGroup title={isSheep ? "Hijas en el rebaño" : "Hijas en la explotación"}>
          {daughters.map((h) => (
            <ListRow
              key={h.id}
              href={`${base}/${h.id}`}
              leading={<AnimalAvatar name={h.nickname || h.tagId} seed={h.tagId} src={h.photoThumb} size="sm" />}
              title={h.nickname || h.tagId}
              subtitle={
                <span className="tabular">
                  {[h.nickname ? h.tagId : null, ageLabel(h.birthDate)].filter(Boolean).join(" · ")}
                </span>
              }
              trailing={
                h.status !== "activo" ? <Badge variant="secondary">Baja</Badge> : undefined
              }
            />
          ))}
        </ListGroup>
      )}

      <BreedingFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        action={createAction}
        title="Nueva crianza"
        gestationDays={gestationDays}
        inseminationLabel={isSheep ? "Inseminación / cubrición" : "Cubrición"}
        sireLabel={isSheep ? "Semental" : "Macho"}
      />
    </div>
  );
}
