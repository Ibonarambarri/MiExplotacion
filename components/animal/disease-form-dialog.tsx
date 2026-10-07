"use client";

import { useActionState, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { DeleteZone } from "@/components/animal/delete-zone";
import { todayIso } from "@/lib/dates";
import type { ActionResult } from "@/actions/sheep";
import type { SheepDisease, RabbitDisease } from "@/db/schema";

type Dis = SheepDisease | RabbitDisease;
type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult>;

export function DiseaseFormDialog({
  open,
  onOpenChange,
  action,
  initial,
  title,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: SubmitAction;
  initial?: Dis | null;
  title: string;
  onDelete?: () => Promise<void>;
}) {
  const [resolved, setResolved] = useState<boolean>(initial?.resolved ?? false);

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) {
      toast.success("Enfermedad guardada");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
    return res;
  }, null);

  const fe = !state?.ok ? state?.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <Field
            label="Inicio"
            htmlFor="startDate"
            required
            error={fe?.startDate}
          >
            <Input
              id="startDate"
              name="startDate"
              type="date"
              required
              defaultValue={initial?.startDate ?? todayIso()}
            />
          </Field>
          <Field label="Nombre" htmlFor="name" required error={fe?.name}>
            <Input
              id="name"
              name="name"
              required
              defaultValue={initial?.name ?? ""}
              placeholder="p. ej. Diarrea, Mamitis"
            />
          </Field>
          <Field
            label="Tratamiento"
            htmlFor="treatment"
            error={fe?.treatment}
          >
            <Textarea
              id="treatment"
              name="treatment"
              rows={2}
              defaultValue={initial?.treatment ?? ""}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Medicación"
              htmlFor="medication"
              error={fe?.medication}
            >
              <Input
                id="medication"
                name="medication"
                autoComplete="off"
                defaultValue={initial?.medication ?? ""}
              />
            </Field>
            <Field label="Dosis" htmlFor="dose" error={fe?.dose}>
              <Input
                id="dose"
                name="dose"
                defaultValue={initial?.dose ?? ""}
              />
            </Field>
          </div>
          <Field
            label="Frecuencia"
            htmlFor="frequency"
            error={fe?.frequency}
          >
            <Input
              id="frequency"
              name="frequency"
              defaultValue={initial?.frequency ?? ""}
              placeholder="cada 12 h, 1 vez/día…"
            />
          </Field>

          <label className="flex min-h-11 items-center justify-between gap-3 rounded-xl border border-input bg-card px-3 py-2">
            <span className="text-sm font-medium">Curada / resuelta</span>
            <input
              type="checkbox"
              name="resolved"
              checked={resolved}
              onChange={(e) => setResolved(e.target.checked)}
              className="h-5 w-5 accent-[var(--primary)]"
            />
          </label>

          {resolved && (
            <Field
              label="Fecha de resolución"
              htmlFor="resolvedDate"
              required
              error={fe?.resolvedDate}
            >
              <Input
                id="resolvedDate"
                name="resolvedDate"
                type="date"
                required
                defaultValue={initial?.resolvedDate ?? todayIso()}
              />
            </Field>
          )}

          <Field label="Notas" htmlFor="notes" error={fe?.notes}>
            <Textarea
              id="notes"
              name="notes"
              rows={2}
              defaultValue={initial?.notes ?? ""}
            />
          </Field>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
        {onDelete && <DeleteZone label="Eliminar enfermedad" onDelete={onDelete} />}
      </DialogContent>
    </Dialog>
  );
}
