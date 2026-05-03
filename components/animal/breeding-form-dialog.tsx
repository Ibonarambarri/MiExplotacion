"use client";

import { useActionState, useState, useEffect } from "react";
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
import { addDaysIso, todayIso } from "@/lib/dates";
import type { ActionResult } from "@/actions/sheep";
import type { SheepBreeding, RabbitBreeding } from "@/db/schema";

type Br = SheepBreeding | RabbitBreeding;
type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult<{ id: number }> | ActionResult>;

export function BreedingFormDialog({
  open,
  onOpenChange,
  action,
  initial,
  title,
  gestationDays,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: SubmitAction;
  initial?: Br | null;
  title: string;
  gestationDays: number;
}) {
  const [insem, setInsem] = useState<string>(
    initial?.inseminationDate ?? todayIso(),
  );
  const [expected, setExpected] = useState<string>(
    initial?.expectedBirthDate ?? addDaysIso(insem, gestationDays),
  );
  const [expectedTouched, setExpectedTouched] = useState<boolean>(
    !!initial?.expectedBirthDate,
  );

  useEffect(() => {
    if (!expectedTouched) {
      setExpected(addDaysIso(insem, gestationDays));
    }
  }, [insem, expectedTouched, gestationDays]);

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) {
      toast.success("Crianza guardada");
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
          <Field
            label="Inseminación / cubrición"
            htmlFor="inseminationDate"
            required
            error={fe?.inseminationDate}
          >
            <Input
              id="inseminationDate"
              name="inseminationDate"
              type="date"
              required
              value={insem}
              onChange={(e) => setInsem(e.target.value)}
            />
          </Field>

          <Field
            label="Parto esperado"
            htmlFor="expectedBirthDate"
            hint={`Calculado automáticamente (+${gestationDays} días). Puedes editarlo.`}
            error={fe?.expectedBirthDate}
          >
            <Input
              id="expectedBirthDate"
              name="expectedBirthDate"
              type="date"
              value={expected}
              onChange={(e) => {
                setExpected(e.target.value);
                setExpectedTouched(true);
              }}
            />
          </Field>

          <Field
            label="Parto real"
            htmlFor="actualBirthDate"
            error={fe?.actualBirthDate}
          >
            <Input
              id="actualBirthDate"
              name="actualBirthDate"
              type="date"
              defaultValue={initial?.actualBirthDate ?? ""}
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
