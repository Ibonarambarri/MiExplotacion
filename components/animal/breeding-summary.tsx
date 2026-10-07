"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { BreedingFormDialog } from "@/components/animal/breeding-form-dialog";
import {
  deleteSheepBreedingAction,
  updateSheepBreedingAction,
} from "@/actions/sheep-breedings";
import {
  deleteRabbitBreedingAction,
  updateRabbitBreedingAction,
} from "@/actions/rabbit-breedings";
import { daysBetweenIso, todayIso } from "@/lib/dates";
import { formatDateEs } from "@/lib/utils";
import type { RabbitBreeding, SheepBreeding } from "@/db/schema";

/** Cabecera de la página de crianza: estado, progreso de gestación y fechas. */
export function BreedingSummary({
  kind,
  animalId,
  breeding,
  gestationDays,
  backHref,
}: {
  kind: "oveja" | "coneja";
  animalId: number;
  breeding: SheepBreeding | RabbitBreeding;
  gestationDays: number;
  backHref: string;
}) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [askDelete, setAskDelete] = useState(false);
  const isSheep = kind === "oveja";
  const open = !breeding.actualBirthDate;

  const total = Math.max(1, daysBetweenIso(breeding.inseminationDate, breeding.expectedBirthDate));
  const elapsed = daysBetweenIso(breeding.inseminationDate, todayIso());
  const progress = Math.min(1, Math.max(0, elapsed / total));
  const left = total - elapsed;

  const update = isSheep
    ? updateSheepBreedingAction.bind(null, animalId, breeding.id)
    : updateRabbitBreedingAction.bind(null, animalId, breeding.id);

  return (
    <>
      <Card className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <Badge variant={open ? "harvest" : "success"}>{open ? "En gestación" : "Parida"}</Badge>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label="Editar crianza" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Eliminar crianza"
              className="text-destructive hover:text-destructive"
              onClick={() => setAskDelete(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {open && (
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-2xl font-semibold tracking-tight tabular">
                {left > 0 ? `Faltan ${left} ${left === 1 ? "día" : "días"}` : left === 0 ? "Parto previsto hoy" : `Atrasado ${-left} ${left === -1 ? "día" : "días"}`}
              </span>
              <span className="tabular text-sm text-muted-foreground">
                día {Math.max(0, Math.min(elapsed, total))} de {total}
              </span>
            </div>
            <div
              className="mt-2 h-2.5 overflow-hidden rounded-full bg-harvest-soft"
              role="progressbar"
              aria-label="Progreso de la gestación"
              aria-valuemin={0}
              aria-valuemax={total}
              aria-valuenow={Math.max(0, Math.min(elapsed, total))}
            >
              <div
                className="h-full w-full origin-left rounded-full bg-harvest transition-transform duration-300"
                style={{ transform: `scaleX(${progress})` }}
              />
            </div>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Item label={isSheep ? "Inseminación" : "Cubrición"} value={formatDateEs(breeding.inseminationDate)} />
          <Item label="Parto previsto" value={formatDateEs(breeding.expectedBirthDate)} />
          <Item
            label="Parto real"
            value={breeding.actualBirthDate ? formatDateEs(breeding.actualBirthDate) : "Pendiente"}
          />
          <Item label={isSheep ? "Semental" : "Macho"} value={breeding.sire || "—"} />
        </dl>

        {breeding.notes && (
          <p className="whitespace-pre-wrap rounded-xl bg-muted px-3 py-2 text-sm">{breeding.notes}</p>
        )}

        {open && (
          <Button variant="harvest" className="w-full" onClick={() => setEditOpen(true)}>
            Registrar parto
          </Button>
        )}
      </Card>

      <BreedingFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        action={update}
        initial={breeding}
        title={open ? "Crianza · registrar parto" : "Editar crianza"}
        gestationDays={gestationDays}
        inseminationLabel={isSheep ? "Inseminación / cubrición" : "Cubrición"}
        sireLabel={isSheep ? "Semental" : "Macho"}
      />

      <ConfirmDialog
        open={askDelete}
        onOpenChange={setAskDelete}
        title="¿Eliminar esta crianza?"
        description={
          isSheep
            ? "Se borrarán también sus corderos y sus pesajes. Esta acción no se puede deshacer."
            : "Se borrará también la camada y sus pesajes. Esta acción no se puede deshacer."
        }
        onConfirm={async () => {
          const r = isSheep
            ? await deleteSheepBreedingAction(animalId, breeding.id)
            : await deleteRabbitBreedingAction(animalId, breeding.id);
          if (r.ok) {
            toast.success("Crianza eliminada");
            router.replace(backHref);
          }
          return r;
        }}
      />
    </>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="tabular mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
