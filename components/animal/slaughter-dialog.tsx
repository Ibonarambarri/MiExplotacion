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
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { todayIso } from "@/lib/dates";
import type { ActionResult } from "@/actions/sheep";

type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult>;

export function SlaughterDialog({
  open,
  onOpenChange,
  action,
  defaultUnits,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: SubmitAction;
  defaultUnits: number;
}) {
  const [, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) {
      toast.success("Matanza registrada");
      onOpenChange(false);
    } else {
      toast.error(res.error);
    }
    return res;
  }, null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar matanza</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-3">
          <Field label="Fecha" htmlFor="slaughterDate" required>
            <Input
              id="slaughterDate"
              name="slaughterDate"
              type="date"
              required
              defaultValue={todayIso()}
            />
          </Field>
          <Field
            label="Unidades sacrificadas"
            htmlFor="slaughteredUnits"
            hint={`Por defecto las ${defaultUnits} unidades vivas actuales.`}
          >
            <Input
              id="slaughteredUnits"
              name="slaughteredUnits"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              defaultValue={defaultUnits}
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
              {isPending ? "Guardando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
