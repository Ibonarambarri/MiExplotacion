"use client";

import { useState } from "react";
import { Plus, Sprout } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListGroup, ListRow, RowIcon } from "@/components/ui/list";
import { ChipGroup, Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/empty-state";
import { LambFormDialog } from "@/components/animal/lamb-form-dialog";
import { LambStatusBadge } from "@/components/animal/lamb-status-badge";
import { PromoteLambDialog } from "@/components/animal/promote-lamb-dialog";
import { WeightsPanel } from "@/components/animal/weights-panel";
import { toastWithUndo } from "@/components/animal/undo-toast";
import { useSheet } from "@/components/animal/use-sheet";
import {
  createLambAction,
  updateLambAction,
  deleteLambAction,
  restoreLambAction,
} from "@/actions/sheep-breedings";
import { formatDateEs, formatEur, formatKg } from "@/lib/utils";
import type { Lamb, SheepBreeding } from "@/db/schema";
import type { WeightPoint } from "@/lib/queries/weights";

const lambName = (l: Lamb, i: number) => l.nickname || `Cordero ${i + 1}`;

function lambDetail(l: Lamb): string {
  const sex = l.gender === "macho" ? "Macho" : l.gender === "hembra" ? "Hembra" : "Sexo sin indicar";
  if (l.status === "vendido")
    return [sex, l.saleDate && `vendido ${formatDateEs(l.saleDate)}`, l.salePriceEur && formatEur(l.salePriceEur)]
      .filter(Boolean)
      .join(" · ");
  if (l.status === "sacrificado")
    return [sex, l.slaughterDate && formatDateEs(l.slaughterDate), l.deadWeightKg && formatKg(l.deadWeightKg)]
      .filter(Boolean)
      .join(" · ");
  if (l.status === "muerto_natural")
    return [sex, l.slaughterDate && `baja ${formatDateEs(l.slaughterDate)}`].filter(Boolean).join(" · ");
  return sex;
}

export function BreedingClient({
  sheepId,
  motherName,
  breeding,
  lambs,
  lambWeights,
}: {
  sheepId: number;
  motherName: string;
  breeding: SheepBreeding;
  lambs: Lamb[];
  lambWeights: Record<number, WeightPoint[]>;
}) {
  const breedingId = breeding.id;
  const [createOpen, setCreateOpen] = useState(false);
  const edit = useSheet<Lamb>();
  const promote = useSheet<Lamb>();
  const [weighing, setWeighing] = useState<number | null>(lambs[0]?.id ?? null);
  const weighed = lambs.find((l) => l.id === weighing) ?? lambs[0];

  async function removeLamb(l: Lamb) {
    const r = await deleteLambAction(sheepId, breedingId, l.id);
    if (!r.ok) return void toast.error(r.error);
    edit.hide();
    const snap = r.data;
    toastWithUndo(
      snap?.transactions.length ? "Cordero eliminado (y su ingreso)" : "Cordero eliminado",
      async () =>
        snap ? restoreLambAction(sheepId, breedingId, snap) : { ok: false, error: "Nada que deshacer" },
    );
  }

  const canPromote = (l: Lamb) => l.gender === "hembra" && l.status === "vivo" && !l.promotedSheepId;

  return (
    <div className="space-y-6">
      {lambs.length === 0 ? (
        <EmptyState
          title="Sin corderos"
          description={
            breeding.actualBirthDate
              ? "Apunta los corderos nacidos en este parto."
              : "Cuando para, registra el parto y añade aquí los corderos."
          }
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Añadir cordero
            </Button>
          }
        />
      ) : (
        <ListGroup
          title={`Corderos (${lambs.length})`}
          action={
            <Button size="sm" variant="ghost" className="-my-2 -mr-2 h-11 text-primary" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Añadir
            </Button>
          }
        >
          {lambs.map((l, i) => {
            const lastW = lambWeights[l.id]?.at(-1);
            return (
              <ListRow
                key={l.id}
                onClick={() => edit.show(l)}
                leading={
                  <RowIcon tone={l.gender === "hembra" ? "harvest" : l.gender === "macho" ? "info" : "muted"}>
                    <span className="text-sm font-bold" aria-hidden>
                      {l.gender === "hembra" ? "H" : l.gender === "macho" ? "M" : "?"}
                    </span>
                  </RowIcon>
                }
                title={lambName(l, i)}
                subtitle={
                  <span className="tabular">
                    {lambDetail(l)}
                    {lastW ? ` · ${formatKg(lastW.weightKg)}` : ""}
                  </span>
                }
                trailing={
                  l.promotedSheepId ? (
                    <Badge variant="success">
                      <Sprout className="h-3 w-3" aria-hidden /> En el rebaño
                    </Badge>
                  ) : (
                    <LambStatusBadge status={l.status} />
                  )
                }
              />
            );
          })}
        </ListGroup>
      )}

      {lambs.length > 0 && weighed && (
        <section className="space-y-3" aria-labelledby="pesajes-corderos">
          <h2
            id="pesajes-corderos"
            className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Pesajes
          </h2>
          {lambs.length > 1 && (
            <ChipGroup label="Elegir cordero">
              {lambs.map((l, i) => (
                <Chip key={l.id} active={l.id === weighed.id} onClick={() => setWeighing(l.id)}>
                  {lambName(l, i)}
                </Chip>
              ))}
            </ChipGroup>
          )}
          <WeightsPanel
            key={weighed.id}
            target={{ kind: "lamb", id: weighed.id }}
            points={lambWeights[weighed.id] ?? []}
            compact
          />
        </section>
      )}

      <LambFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        action={createLambAction.bind(null, sheepId, breedingId)}
        title="Nuevo cordero"
      />

      {edit.item && (
        <LambFormDialog
          key={edit.item.id}
          open={edit.open}
          onOpenChange={edit.onOpenChange}
          action={updateLambAction.bind(null, sheepId, breedingId, edit.item.id)}
          initial={edit.item}
          title={`Editar ${lambName(edit.item, lambs.findIndex((l) => l.id === edit.item!.id))}`}
          onDelete={() => removeLamb(edit.item!)}
          onPromote={
            canPromote(edit.item)
              ? () => {
                  const l = edit.item!;
                  edit.hide();
                  promote.show(l);
                }
              : undefined
          }
        />
      )}

      {promote.item && (
        <PromoteLambDialog
          key={promote.item.id}
          open={promote.open}
          onOpenChange={promote.onOpenChange}
          sheepId={sheepId}
          breedingId={breedingId}
          lamb={promote.item}
          birthDate={breeding.actualBirthDate}
          motherName={motherName}
        />
      )}
    </div>
  );
}
