"use client";

import { useActionState } from "react";
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
import type { ActionResult } from "@/actions/sheep";
import type { Litter } from "@/db/schema";

type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult>;

export function LitterFormDialog({
  open,
  onOpenChange,
  action,
  initial,
  title,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: SubmitAction;
  initial?: Litter | null;
  title: string;
}) {
  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) {
      toast.success("Camada guardada");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
    return res;
  }, null);

  const fe = !state?.ok ? state?.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Unidades iniciales"
              htmlFor="initialUnits"
              error={fe?.initialUnits}
            >
              <Input
                id="initialUnits"
                name="initialUnits"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                defaultValue={initial?.initialUnits ?? ""}
              />
            </Field>
            <Field
              label="Unidades vivas"
              htmlFor="currentUnits"
              hint={!initial ? "Por defecto = iniciales" : undefined}
              error={fe?.currentUnits}
            >
              <Input
                id="currentUnits"
                name="currentUnits"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                defaultValue={initial?.currentUnits ?? ""}
              />
            </Field>
          </div>

          {initial && (
            <Field
              label="Bajas naturales"
              htmlFor="naturalDeaths"
              error={fe?.naturalDeaths}
            >
              <Input
                id="naturalDeaths"
                name="naturalDeaths"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                defaultValue={initial?.naturalDeaths ?? 0}
              />
            </Field>
          )}

          <Field
            label="Peso medio (kg)"
            htmlFor="averageWeightKg"
            error={fe?.averageWeightKg}
          >
            <Input
              id="averageWeightKg"
              name="averageWeightKg"
              type="number"
              step="0.01"
              inputMode="decimal"
              defaultValue={initial?.averageWeightKg ?? ""}
            />
          </Field>

          {initial && (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Fecha de matanza"
                htmlFor="slaughterDate"
                error={fe?.slaughterDate}
              >
                <Input
                  id="slaughterDate"
                  name="slaughterDate"
                  type="date"
                  defaultValue={initial?.slaughterDate ?? ""}
                />
              </Field>
              <Field
                label="Unidades sacrificadas"
                htmlFor="slaughteredUnits"
                error={fe?.slaughteredUnits}
              >
                <Input
                  id="slaughteredUnits"
                  name="slaughteredUnits"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  step={1}
                  defaultValue={initial?.slaughteredUnits ?? ""}
                />
              </Field>
            </div>
          )}

          <Field label="Observaciones" htmlFor="notes" error={fe?.notes}>
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
