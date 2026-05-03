"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BreedingFormDialog } from "@/components/animal/breeding-form-dialog";
import { LambFormDialog } from "@/components/animal/lamb-form-dialog";
import { LambStatusBadge } from "@/components/animal/lamb-status-badge";
import {
  updateSheepBreedingAction,
  deleteSheepBreedingAction,
  createLambAction,
  updateLambAction,
  deleteLambAction,
} from "@/actions/sheep-breedings";
import { SHEEP_GESTATION_DAYS } from "@/lib/dates";
import { formatDateEs, formatEur, formatKg } from "@/lib/utils";
import type { Lamb, SheepBreeding } from "@/db/schema";

export function BreedingClient({
  sheepId,
  breeding,
  lambs,
}: {
  sheepId: number;
  breeding: SheepBreeding;
  lambs: Lamb[];
}) {
  const [editBreedingOpen, setEditBreedingOpen] = useState(false);
  const [askDeleteBreeding, setAskDeleteBreeding] = useState(false);
  const [createLambOpen, setCreateLambOpen] = useState(false);
  const [editingLamb, setEditingLamb] = useState<Lamb | null>(null);
  const [askDeleteLamb, setAskDeleteLamb] = useState<Lamb | null>(null);

  const breedingId = breeding.id;

  const updateBreeding = updateSheepBreedingAction.bind(
    null,
    sheepId,
    breedingId,
  );
  const createLamb = createLambAction.bind(null, sheepId, breedingId);

  return (
    <>
      <Card>
        <CardContent className="space-y-3 p-4">
          <Row label="Inseminación">
            {formatDateEs(breeding.inseminationDate)}
          </Row>
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
          <h2 className="text-lg font-semibold">Corderos</h2>
          <Button size="sm" onClick={() => setCreateLambOpen(true)}>
            <Plus className="h-4 w-4" /> Cordero
          </Button>
        </div>

        {lambs.length === 0 ? (
          <EmptyState
            title="Sin corderos"
            description="Añade los corderos cuando se produzca el parto."
          />
        ) : (
          <div className="grid gap-2">
            {lambs.map((l, i) => (
              <Card key={l.id}>
                <CardContent className="space-y-1 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {l.nickname || `Cordero ${i + 1}`}
                        </span>
                        <LambStatusBadge status={l.status} />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {l.gender
                          ? l.gender === "macho"
                            ? "Macho"
                            : "Hembra"
                          : "Sexo no especificado"}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Editar"
                        onClick={() => setEditingLamb(l)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar"
                        onClick={() => setAskDeleteLamb(l)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    {l.status === "sacrificado" && (
                      <div>
                        Sacrificado{" "}
                        {l.slaughterDate ? formatDateEs(l.slaughterDate) : ""}
                        {l.deadWeightKg
                          ? ` · Peso ${formatKg(l.deadWeightKg)}`
                          : ""}
                      </div>
                    )}
                    {l.status === "vendido" && (
                      <div>
                        Vendido {l.saleDate ? formatDateEs(l.saleDate) : ""}
                        {l.salePriceEur
                          ? ` · ${formatEur(l.salePriceEur)}`
                          : ""}
                      </div>
                    )}
                    {l.status === "muerto_natural" && l.slaughterDate && (
                      <div>Baja {formatDateEs(l.slaughterDate)}</div>
                    )}
                    {l.notes && <div>{l.notes}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <BreedingFormDialog
        open={editBreedingOpen}
        onOpenChange={setEditBreedingOpen}
        action={updateBreeding}
        initial={breeding}
        title="Editar crianza"
        gestationDays={SHEEP_GESTATION_DAYS}
      />

      <ConfirmDialog
        open={askDeleteBreeding}
        onOpenChange={setAskDeleteBreeding}
        title="¿Eliminar esta crianza?"
        description="Se borrarán también todos los corderos asociados."
        onConfirm={async () => {
          const r = await deleteSheepBreedingAction(sheepId, breedingId);
          if (r.ok) {
            toast.success("Crianza eliminada");
            window.location.href = `/ovejas/${sheepId}`;
          }
          return r;
        }}
      />

      <LambFormDialog
        open={createLambOpen}
        onOpenChange={setCreateLambOpen}
        action={createLamb}
        title="Nuevo cordero"
      />

      {editingLamb && (
        <LambFormDialog
          open={!!editingLamb}
          onOpenChange={(v) => !v && setEditingLamb(null)}
          action={updateLambAction.bind(
            null,
            sheepId,
            breedingId,
            editingLamb.id,
          )}
          initial={editingLamb}
          title="Editar cordero"
        />
      )}

      <ConfirmDialog
        open={!!askDeleteLamb}
        onOpenChange={(v) => !v && setAskDeleteLamb(null)}
        title="¿Eliminar cordero?"
        description={askDeleteLamb?.nickname ?? "Cordero"}
        onConfirm={async () => {
          if (!askDeleteLamb) return;
          const r = await deleteLambAction(
            sheepId,
            breedingId,
            askDeleteLamb.id,
          );
          if (r.ok) toast.success("Cordero eliminado");
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
