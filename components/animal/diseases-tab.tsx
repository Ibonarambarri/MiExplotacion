"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { DiseaseFormDialog } from "@/components/animal/disease-form-dialog";
import { formatDateEs } from "@/lib/utils";
import type { ActionResult } from "@/actions/sheep";
import type { SheepDisease, RabbitDisease } from "@/db/schema";

type Dis = SheepDisease | RabbitDisease;

export function DiseasesTab({
  diseases,
  createAction,
  buildUpdateAction,
  buildDeleteAction,
}: {
  diseases: Dis[];
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
  const [editing, setEditing] = useState<Dis | null>(null);
  const [askDelete, setAskDelete] = useState<Dis | null>(null);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" /> Enfermedad
        </Button>
      </div>

      {diseases.length === 0 ? (
        <EmptyState
          icon={<HeartPulse className="h-6 w-6" />}
          title="Sin enfermedades"
          description="No hay episodios registrados."
        />
      ) : (
        <div className="grid gap-2">
          {diseases.map((d) => (
            <Card key={d.id}>
              <CardContent className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{d.name}</span>
                      <Badge
                        variant={d.resolved ? "success" : "warning"}
                      >
                        {d.resolved ? "Resuelta" : "Activa"}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Inicio: {formatDateEs(d.startDate)}
                      {d.resolved && d.resolvedDate
                        ? ` · Fin: ${formatDateEs(d.resolvedDate)}`
                        : ""}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(d)}
                      aria-label="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setAskDelete(d)}
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {(d.medication || d.dose || d.frequency || d.treatment) && (
                  <div className="space-y-0.5 text-xs text-muted-foreground">
                    {d.medication && <div>Medicación: {d.medication}</div>}
                    {(d.dose || d.frequency) && (
                      <div>
                        {d.dose}
                        {d.dose && d.frequency ? " · " : ""}
                        {d.frequency}
                      </div>
                    )}
                    {d.treatment && <div>{d.treatment}</div>}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DiseaseFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        action={createAction}
        title="Nueva enfermedad"
      />

      {editing && (
        <DiseaseFormDialog
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
          action={buildUpdateAction(editing.id)}
          initial={editing}
          title="Editar enfermedad"
        />
      )}

      <ConfirmDialog
        open={!!askDelete}
        onOpenChange={(v) => !v && setAskDelete(null)}
        title="¿Eliminar enfermedad?"
        description={askDelete?.name}
        onConfirm={async () => {
          if (!askDelete) return;
          const r = await buildDeleteAction(askDelete.id)();
          if (r.ok) toast.success("Enfermedad eliminada");
          return r;
        }}
      />
    </div>
  );
}
