"use client";

import { useState } from "react";
import { HeartPulse, Plus, ShieldCheck, Syringe } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ListGroup, ListRow, RowIcon } from "@/components/ui/list";
import { VaccineFormDialog } from "@/components/animal/vaccine-form-dialog";
import { DiseaseFormDialog } from "@/components/animal/disease-form-dialog";
import { toastWithUndo } from "@/components/animal/undo-toast";
import { useSheet } from "@/components/animal/use-sheet";
import {
  createSheepVaccineAction,
  updateSheepVaccineAction,
  deleteSheepVaccineAction,
  restoreSheepVaccineAction,
} from "@/actions/sheep-vaccines";
import {
  createRabbitVaccineAction,
  updateRabbitVaccineAction,
  deleteRabbitVaccineAction,
  restoreRabbitVaccineAction,
} from "@/actions/rabbit-vaccines";
import {
  createSheepDiseaseAction,
  updateSheepDiseaseAction,
  deleteSheepDiseaseAction,
  restoreSheepDiseaseAction,
} from "@/actions/sheep-diseases";
import {
  createRabbitDiseaseAction,
  updateRabbitDiseaseAction,
  deleteRabbitDiseaseAction,
  restoreRabbitDiseaseAction,
} from "@/actions/rabbit-diseases";
import { daysUntil, todayIso } from "@/lib/dates";
import { formatDateEs } from "@/lib/utils";
import type {
  RabbitDisease,
  RabbitVaccine,
  SheepDisease,
  SheepVaccine,
} from "@/db/schema";

type Vac = SheepVaccine | RabbitVaccine;
type Dis = SheepDisease | RabbitDisease;

/** Acciones de salud según especie, con la misma forma. */
function healthActions(kind: "oveja" | "coneja", id: number) {
  if (kind === "oveja") {
    return {
      createVaccine: createSheepVaccineAction.bind(null, id),
      updateVaccine: (vid: number) => updateSheepVaccineAction.bind(null, id, vid),
      deleteVaccine: (vid: number) => deleteSheepVaccineAction(id, vid),
      restoreVaccine: (row: Vac) => restoreSheepVaccineAction(id, row as SheepVaccine),
      createDisease: createSheepDiseaseAction.bind(null, id),
      updateDisease: (did: number) => updateSheepDiseaseAction.bind(null, id, did),
      deleteDisease: (did: number) => deleteSheepDiseaseAction(id, did),
      restoreDisease: (row: Dis) => restoreSheepDiseaseAction(id, row as SheepDisease),
    };
  }
  return {
    createVaccine: createRabbitVaccineAction.bind(null, id),
    updateVaccine: (vid: number) => updateRabbitVaccineAction.bind(null, id, vid),
    deleteVaccine: (vid: number) => deleteRabbitVaccineAction(id, vid),
    restoreVaccine: (row: Vac) => restoreRabbitVaccineAction(id, row as RabbitVaccine),
    createDisease: createRabbitDiseaseAction.bind(null, id),
    updateDisease: (did: number) => updateRabbitDiseaseAction.bind(null, id, did),
    deleteDisease: (did: number) => deleteRabbitDiseaseAction(id, did),
    restoreDisease: (row: Dis) => restoreRabbitDiseaseAction(id, row as RabbitDisease),
  };
}

/** Vacuna vencida = próxima dosis pasada y sin otra posterior del mismo tipo. */
function overdueIds(vaccines: Vac[]): Set<number> {
  const today = todayIso();
  const out = new Set<number>();
  for (const v of vaccines) {
    if (!v.nextDoseDate || v.nextDoseDate >= today) continue;
    const type = v.type.trim().toLowerCase();
    const later = vaccines.some(
      (o) =>
        o.id !== v.id &&
        o.type.trim().toLowerCase() === type &&
        (o.date > v.date || (o.date === v.date && o.id > v.id)),
    );
    if (!later) out.add(v.id);
  }
  return out;
}

export function HealthTab({
  kind,
  animalId,
  vaccines,
  diseases,
  presets,
}: {
  kind: "oveja" | "coneja";
  animalId: number;
  vaccines: Vac[];
  diseases: Dis[];
  presets: string[];
}) {
  const a = healthActions(kind, animalId);
  const [newVaccine, setNewVaccine] = useState(false);
  const [newDisease, setNewDisease] = useState(false);
  const editVaccine = useSheet<Vac>();
  const editDisease = useSheet<Dis>();
  const overdue = overdueIds(vaccines);
  const active = diseases.filter((d) => !d.resolved);
  const resolved = diseases.filter((d) => d.resolved);

  async function removeVaccine(v: Vac) {
    const r = await a.deleteVaccine(v.id);
    if (!r.ok) return void toast.error(r.error);
    editVaccine.hide();
    const row = r.data;
    toastWithUndo(`Vacuna "${v.type}" eliminada`, async () =>
      row ? a.restoreVaccine(row) : { ok: false, error: "Nada que deshacer" },
    );
  }
  async function removeDisease(d: Dis) {
    const r = await a.deleteDisease(d.id);
    if (!r.ok) return void toast.error(r.error);
    editDisease.hide();
    const row = r.data;
    toastWithUndo(`Enfermedad "${d.name}" eliminada`, async () =>
      row ? a.restoreDisease(row) : { ok: false, error: "Nada que deshacer" },
    );
  }

  const diseaseRow = (d: Dis) => (
    <ListRow
      key={d.id}
      onClick={() => editDisease.show(d)}
      leading={
        <RowIcon tone={d.resolved ? "success" : "warning"}>
          {d.resolved ? <ShieldCheck /> : <HeartPulse />}
        </RowIcon>
      }
      title={d.name}
      subtitle={
        <span className="tabular">
          {d.resolved && d.resolvedDate
            ? `${formatDateEs(d.startDate)} – ${formatDateEs(d.resolvedDate)}`
            : `Desde ${formatDateEs(d.startDate)}`}
          {d.medication ? ` · ${d.medication}` : ""}
        </span>
      }
      trailing={
        <Badge variant={d.resolved ? "success" : "warning"}>
          {d.resolved ? "Curada" : "En tratamiento"}
        </Badge>
      }
    />
  );

  return (
    <div className="space-y-6">
      <ListGroup
        title="Enfermedades"
        action={
          <Button size="sm" variant="ghost" className="-my-2 -mr-2 h-11 text-primary" onClick={() => setNewDisease(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Añadir
          </Button>
        }
      >
        {diseases.length === 0 ? (
          <li className="px-4 py-4 text-sm text-muted-foreground">Sin enfermedades registradas.</li>
        ) : (
          [...active, ...resolved].map(diseaseRow)
        )}
      </ListGroup>

      <ListGroup
        title="Vacunas y desparasitaciones"
        action={
          <Button size="sm" variant="ghost" className="-my-2 -mr-2 h-11 text-primary" onClick={() => setNewVaccine(true)}>
            <Plus className="h-4 w-4" aria-hidden /> Añadir
          </Button>
        }
      >
        {vaccines.length === 0 ? (
          <li className="px-4 py-4 text-sm text-muted-foreground">Sin vacunas registradas.</li>
        ) : (
          vaccines.map((v) => {
            const isOverdue = overdue.has(v.id);
            const upcoming = v.nextDoseDate && v.nextDoseDate >= todayIso() ? daysUntil(v.nextDoseDate) : null;
            return (
              <ListRow
                key={v.id}
                onClick={() => editVaccine.show(v)}
                leading={
                  <RowIcon tone={isOverdue ? "destructive" : "info"}>
                    <Syringe />
                  </RowIcon>
                }
                title={v.type}
                subtitle={
                  <span className="tabular">
                    {formatDateEs(v.date)}
                    {v.dose ? ` · ${v.dose}` : ""}
                    {v.vet ? ` · ${v.vet}` : ""}
                  </span>
                }
                trailing={
                  isOverdue ? (
                    <Badge variant="destructive">Vencida</Badge>
                  ) : upcoming !== null ? (
                    <Badge variant="info">
                      {upcoming <= 30
                        ? upcoming === 0
                          ? "Próxima hoy"
                          : `Próxima en ${upcoming}d`
                        : `Próxima ${formatDateEs(v.nextDoseDate!).slice(0, 5)}`}
                    </Badge>
                  ) : undefined
                }
              />
            );
          })
        )}
      </ListGroup>

      <VaccineFormDialog
        open={newVaccine}
        onOpenChange={setNewVaccine}
        action={a.createVaccine}
        title="Nueva vacuna"
        presets={presets}
      />
      {editVaccine.item && (
        <VaccineFormDialog
          key={editVaccine.item.id}
          open={editVaccine.open}
          onOpenChange={editVaccine.onOpenChange}
          action={a.updateVaccine(editVaccine.item.id)}
          initial={editVaccine.item}
          title="Editar vacuna"
          presets={presets}
          onDelete={() => removeVaccine(editVaccine.item!)}
        />
      )}

      <DiseaseFormDialog
        open={newDisease}
        onOpenChange={setNewDisease}
        action={a.createDisease}
        title="Nueva enfermedad"
      />
      {editDisease.item && (
        <DiseaseFormDialog
          key={editDisease.item.id}
          open={editDisease.open}
          onOpenChange={editDisease.onOpenChange}
          action={a.updateDisease(editDisease.item.id)}
          initial={editDisease.item}
          title="Editar enfermedad"
          onDelete={() => removeDisease(editDisease.item!)}
        />
      )}
    </div>
  );
}
