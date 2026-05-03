"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2, Plus, Skull, Drumstick } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BreedingFormDialog } from "@/components/animal/breeding-form-dialog";
import { LitterFormDialog } from "@/components/animal/litter-form-dialog";
import { SlaughterDialog } from "@/components/animal/slaughter-dialog";
import {
  updateRabbitBreedingAction,
  deleteRabbitBreedingAction,
  createLitterAction,
  updateLitterAction,
  deleteLitterAction,
  recordLitterDeathAction,
  recordLitterSlaughterAction,
} from "@/actions/rabbit-breedings";
import { RABBIT_GESTATION_DAYS } from "@/lib/dates";
import { formatDateEs, formatKg } from "@/lib/utils";
import type { Litter, RabbitBreeding } from "@/db/schema";

export function LitterClient({
  rabbitId,
  breeding,
  litter,
}: {
  rabbitId: number;
  breeding: RabbitBreeding;
  litter: Litter | null;
}) {
  const breedingId = breeding.id;

  const [editBreedingOpen, setEditBreedingOpen] = useState(false);
  const [askDeleteBreeding, setAskDeleteBreeding] = useState(false);
  const [createLitterOpen, setCreateLitterOpen] = useState(false);
  const [editLitterOpen, setEditLitterOpen] = useState(false);
  const [askDeleteLitter, setAskDeleteLitter] = useState(false);
  const [slaughterOpen, setSlaughterOpen] = useState(false);
  const [, startTransition] = useTransition();

  const updateBreeding = updateRabbitBreedingAction.bind(
    null,
    rabbitId,
    breedingId,
  );
  const createLitter = createLitterAction.bind(null, rabbitId, breedingId);
  const updateLitter = litter
    ? updateLitterAction.bind(null, rabbitId, breedingId, litter.id)
    : null;
  const slaughterAction = litter
    ? recordLitterSlaughterAction.bind(null, rabbitId, breedingId, litter.id)
    : null;

  const canCreateLitter = !!breeding.actualBirthDate && !litter;

  function handleRecordDeath() {
    if (!litter) return;
    startTransition(async () => {
      const r = await recordLitterDeathAction(rabbitId, breedingId, litter.id);
      if (r.ok) toast.success("Muerte natural registrada");
      else toast.error(r.error);
    });
  }

  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-4">
          <Row label="Cubrición">{formatDateEs(breeding.inseminationDate)}</Row>
          <Row label="Parto esperado">
            {formatDateEs(breeding.expectedBirthDate)}
          </Row>
          <Row label="Parto real">
            {breeding.actualBirthDate
              ? formatDateEs(breeding.actualBirthDate)
              : "Pendiente"}
          </Row>
          {breeding.notes && (
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">
                Notas
              </div>
              <p className="whitespace-pre-wrap text-sm">{breeding.notes}</p>
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEditBreedingOpen(true)}
              className="flex-1"
            >
              <Pencil className="h-4 w-4" /> Editar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setAskDeleteBreeding(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Camada</h2>
          {canCreateLitter && (
            <Button size="sm" onClick={() => setCreateLitterOpen(true)}>
              <Plus className="h-4 w-4" /> Camada
            </Button>
          )}
        </div>

        {!litter ? (
          breeding.actualBirthDate ? (
            <EmptyState
              title="Sin camada"
              description="Registra la camada con las unidades nacidas."
              action={
                <Button onClick={() => setCreateLitterOpen(true)}>
                  <Plus className="h-4 w-4" /> Camada
                </Button>
              }
            />
          ) : (
            <EmptyState
              title="Aún sin parir"
              description="Cuando registres el parto real podrás añadir la camada."
            />
          )
        ) : (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="Vivos" value={litter.currentUnits} />
                <Stat label="Iniciales" value={litter.initialUnits} muted />
                <Stat
                  label="Bajas"
                  value={litter.naturalDeaths}
                  muted
                />
              </div>

              {litter.averageWeightKg && (
                <div className="text-center text-sm text-muted-foreground">
                  Peso medio: {formatKg(litter.averageWeightKg)}
                </div>
              )}

              {litter.slaughterDate && (
                <div className="rounded-lg bg-muted p-3 text-center text-sm">
                  <Badge variant="warning" className="mb-1">
                    Matanza
                  </Badge>
                  <div>
                    {formatDateEs(litter.slaughterDate)} ·{" "}
                    {litter.slaughteredUnits ?? 0} unidades
                  </div>
                </div>
              )}

              {litter.notes && (
                <div>
                  <div className="mb-1 text-xs font-medium text-muted-foreground">
                    Observaciones
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{litter.notes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRecordDeath}
                  disabled={litter.currentUnits <= 0}
                >
                  <Skull className="h-4 w-4" />
                  Muerte natural
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setSlaughterOpen(true)}
                  disabled={litter.currentUnits <= 0}
                >
                  <Drumstick className="h-4 w-4" />
                  Matanza
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditLitterOpen(true)}
                >
                  <Pencil className="h-4 w-4" />
                  Editar
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setAskDeleteLitter(true)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <BreedingFormDialog
        open={editBreedingOpen}
        onOpenChange={setEditBreedingOpen}
        action={updateBreeding}
        initial={breeding}
        title="Editar crianza"
        gestationDays={RABBIT_GESTATION_DAYS}
      />

      <ConfirmDialog
        open={askDeleteBreeding}
        onOpenChange={setAskDeleteBreeding}
        title="¿Eliminar esta crianza?"
        description="Se borrará también la camada asociada."
        onConfirm={async () => {
          const r = await deleteRabbitBreedingAction(rabbitId, breedingId);
          if (r.ok) {
            toast.success("Crianza eliminada");
            window.location.href = `/conejas/${rabbitId}`;
          }
          return r;
        }}
      />

      <LitterFormDialog
        open={createLitterOpen}
        onOpenChange={setCreateLitterOpen}
        action={createLitter}
        title="Nueva camada"
      />

      {litter && updateLitter && (
        <LitterFormDialog
          open={editLitterOpen}
          onOpenChange={setEditLitterOpen}
          action={updateLitter}
          initial={litter}
          title="Editar camada"
        />
      )}

      {litter && slaughterAction && (
        <SlaughterDialog
          open={slaughterOpen}
          onOpenChange={setSlaughterOpen}
          action={slaughterAction}
          defaultUnits={litter.currentUnits}
        />
      )}

      <ConfirmDialog
        open={askDeleteLitter}
        onOpenChange={setAskDeleteLitter}
        title="¿Eliminar la camada?"
        onConfirm={async () => {
          if (!litter) return;
          const r = await deleteLitterAction(rabbitId, breedingId, litter.id);
          if (r.ok) toast.success("Camada eliminada");
          return r;
        }}
      />
    </>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/50 pb-2 last:border-0 last:pb-0 text-sm">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="text-right">{children}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  muted,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border ${
        muted ? "bg-muted/40" : "bg-primary/10"
      } p-2`}
    >
      <div
        className={`text-2xl font-semibold ${
          muted ? "text-muted-foreground" : "text-primary"
        }`}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
