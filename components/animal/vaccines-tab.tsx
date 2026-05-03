"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Syringe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { VaccineFormDialog } from "@/components/animal/vaccine-form-dialog";
import { formatDateEs } from "@/lib/utils";
import type { ActionResult } from "@/actions/sheep";
import type { SheepVaccine, RabbitVaccine } from "@/db/schema";

type Vac = SheepVaccine | RabbitVaccine;

export function VaccinesTab({
  vaccines,
  createAction,
  buildUpdateAction,
  buildDeleteAction,
}: {
  vaccines: Vac[];
  createAction: (
    prev: ActionResult | null,
    fd: FormData,
  ) => Promise<ActionResult>;
  buildUpdateAction: (
    id: number,
  ) => (prev: ActionResult | null, fd: FormData) => Promise<ActionResult>;
  buildDeleteAction: (id: number) => () => Promise<ActionResult>;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Vac | null>(null);
  const [askDelete, setAskDelete] = useState<Vac | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Vacuna
        </Button>
      </div>

      {vaccines.length === 0 ? (
        <EmptyState
          icon={<Syringe className="h-6 w-6" />}
          title="Sin vacunas"
          description="Registra la primera vacuna del animal."
        />
      ) : (
        <div className="grid gap-2">
          {vaccines.map((v) => (
            <Card key={v.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{v.type}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateEs(v.date)}
                      {v.dose ? ` · ${v.dose}` : ""}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(v)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAskDelete(v)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {(v.nextDoseDate || v.vet || v.notes) && (
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    {v.nextDoseDate && (
                      <div>Próxima: {formatDateEs(v.nextDoseDate)}</div>
                    )}
                    {v.vet && <div>Veterinario: {v.vet}</div>}
                    {v.notes && <div>{v.notes}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <VaccineFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        action={createAction}
        title="Nueva vacuna"
      />

      {editing && (
        <VaccineFormDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          action={buildUpdateAction(editing.id)}
          initial={editing}
          title="Editar vacuna"
        />
      )}

      <ConfirmDialog
        open={!!askDelete}
        onOpenChange={(v) => !v && setAskDelete(null)}
        title="¿Eliminar vacuna?"
        description={askDelete ? `${askDelete.type} (${formatDateEs(askDelete.date)})` : ""}
        onConfirm={async () => {
          if (!askDelete) return;
          const r = await buildDeleteAction(askDelete.id)();
          if (r.ok) toast.success("Vacuna eliminada");
          return r;
        }}
      />
    </div>
  );
}
