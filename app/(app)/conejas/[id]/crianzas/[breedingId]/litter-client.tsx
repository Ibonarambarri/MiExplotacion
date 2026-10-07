"use client";

import { useState, useTransition } from "react";
import { Drumstick, Pencil, Plus, Skull, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { LitterFormDialog } from "@/components/animal/litter-form-dialog";
import { SlaughterDialog } from "@/components/animal/slaughter-dialog";
import { WeightsPanel } from "@/components/animal/weights-panel";
import { toastWithUndo } from "@/components/animal/undo-toast";
import {
  createLitterAction,
  updateLitterAction,
  deleteLitterAction,
  recordLitterDeathAction,
  undoLitterDeathAction,
  recordLitterSlaughterAction,
} from "@/actions/rabbit-breedings";
import { formatDateEs, formatEur } from "@/lib/utils";
import type { Litter, RabbitBreeding } from "@/db/schema";
import type { WeightPoint } from "@/lib/queries/weights";

export function LitterClient({
  rabbitId,
  breeding,
  litter,
  weights,
}: {
  rabbitId: number;
  breeding: RabbitBreeding;
  litter: Litter | null;
  weights: WeightPoint[];
}) {
  const breedingId = breeding.id;
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const [slaughterOpen, setSlaughterOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function recordDeath() {
    if (!litter) return;
    const litterId = litter.id;
    startTransition(async () => {
      const r = await recordLitterDeathAction(rabbitId, breedingId, litterId);
      if (!r.ok) return void toast.error(r.error);
      toastWithUndo("Baja natural apuntada", () =>
        undoLitterDeathAction(rabbitId, breedingId, litterId),
      );
    });
  }

  if (!litter) {
    return breeding.actualBirthDate ? (
      <>
        <EmptyState
          title="Sin camada"
          description="Apunta cuántos gazapos han nacido."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden /> Añadir camada
            </Button>
          }
        />
        <LitterFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          action={createLitterAction.bind(null, rabbitId, breedingId)}
          title="Nueva camada"
        />
      </>
    ) : (
      <EmptyState
        title="Aún sin parir"
        description="Cuando registres el parto podrás añadir la camada."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-2" aria-labelledby="camada">
        <div className="flex items-end justify-between px-1">
          <h2 id="camada" className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            Camada
          </h2>
          <div className="-mr-2 flex">
            <Button variant="ghost" size="icon" aria-label="Editar camada" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar camada"
              className="text-destructive hover:text-destructive"
              onClick={() => setAskDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <Card className="space-y-4 p-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <Stat label="Vivos" value={litter.currentUnits} tone="harvest" />
            <Stat label="Nacidos" value={litter.initialUnits} />
            <Stat label="Bajas" value={litter.naturalDeaths} tone={litter.naturalDeaths ? "negative" : "default"} />
          </div>

          {litter.slaughterDate && (
            <div className="rounded-xl bg-muted px-3 py-2.5 text-sm">
              <span className="font-medium">Matanza</span>{" "}
              <span className="tabular text-muted-foreground">
                {formatDateEs(litter.slaughterDate)} · {litter.slaughteredUnits ?? 0} gazapos
                {litter.saleAmountEur ? ` · ${formatEur(litter.saleAmountEur)}` : ""}
              </span>
            </div>
          )}

          {litter.notes && <p className="whitespace-pre-wrap text-sm">{litter.notes}</p>}

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={recordDeath}
              disabled={pending || litter.currentUnits <= 0}
            >
              <Skull className="h-4 w-4" aria-hidden />
              Baja natural
            </Button>
            {litter.slaughterDate ? (
              // Matanza ya registrada: se corrige desde "Editar camada" para no
              // descontar dos veces las unidades.
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Drumstick className="h-4 w-4" aria-hidden />
                Editar matanza
              </Button>
            ) : (
              <Button onClick={() => setSlaughterOpen(true)} disabled={litter.currentUnits <= 0}>
                <Drumstick className="h-4 w-4" aria-hidden />
                Matanza
              </Button>
            )}
          </div>
        </Card>
      </section>

      <section className="space-y-3" aria-labelledby="pesajes-camada">
        <h2
          id="pesajes-camada"
          className="px-1 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Peso medio de la camada
        </h2>
        <WeightsPanel
          target={{ kind: "litter", id: litter.id }}
          points={weights}
          label="Peso medio"
          compact
        />
      </section>

      <LitterFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        action={updateLitterAction.bind(null, rabbitId, breedingId, litter.id)}
        initial={litter}
        title="Editar camada"
      />

      <SlaughterDialog
        open={slaughterOpen}
        onOpenChange={setSlaughterOpen}
        action={recordLitterSlaughterAction.bind(null, rabbitId, breedingId, litter.id)}
        defaultUnits={litter.currentUnits}
        defaultAmount={litter.saleAmountEur}
      />

      <ConfirmDialog
        open={askDelete}
        onOpenChange={setAskDelete}
        title="¿Eliminar la camada?"
        description={
          litter.saleAmountEur
            ? "Se borrarán sus pesajes y también su ingreso de venta en Finanzas. No se puede deshacer."
            : "Se borrarán también sus pesajes. No se puede deshacer."
        }
        onConfirm={async () => {
          const r = await deleteLitterAction(rabbitId, breedingId, litter.id);
          if (r.ok) toast.success("Camada eliminada");
          return r;
        }}
      />
    </div>
  );
}
