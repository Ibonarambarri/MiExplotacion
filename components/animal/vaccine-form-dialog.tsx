"use client";

import { useActionState, useEffect } from "react";
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
import { todayIso } from "@/lib/dates";
import type { ActionResult } from "@/actions/sheep";
import type { SheepVaccine, RabbitVaccine } from "@/db/schema";

type Vac = SheepVaccine | RabbitVaccine;
type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult>;

export function VaccineFormDialog({
  open,
  onOpenChange,
  action,
  initial,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: SubmitAction;
  initial?: Vac | null;
  title: string;
}) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) {
      toast.success("Vacuna guardada");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
    return res;
  }, null);

  useEffect(() => {
    if (!open) return;
    // sin reset: el form se desmonta cuando se cierra el dialog
  }, [open]);

  const fe = !state?.ok ? state?.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <Field label="Fecha" htmlFor="date" required error={fe?.date}>
            <Input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={initial?.date ?? todayIso()}
            />
          </Field>
          <Field label="Tipo" htmlFor="type" required error={fe?.type}>
            <Input
              id="type"
              name="type"
              required
              defaultValue={initial?.type ?? ""}
              placeholder="p. ej. Clostridiosis"
            />
          </Field>
          <Field label="Dosis" htmlFor="dose" error={fe?.dose}>
            <Input
              id="dose"
              name="dose"
              defaultValue={initial?.dose ?? ""}
              placeholder="2 ml"
            />
          </Field>
          <Field
            label="Próxima dosis"
            htmlFor="nextDoseDate"
            error={fe?.nextDoseDate}
          >
            <Input
              id="nextDoseDate"
              name="nextDoseDate"
              type="date"
              defaultValue={initial?.nextDoseDate ?? ""}
            />
          </Field>
          <Field label="Veterinario" htmlFor="vet" error={fe?.vet}>
            <Input
              id="vet"
              name="vet"
              defaultValue={initial?.vet ?? ""}
            />
          </Field>
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
      </DialogContent>
    </Dialog>
  );
}
