"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VaccineFields, PresetChips } from "@/components/animal/vaccine-fields";
import { DeleteZone } from "@/components/animal/delete-zone";
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
  presets = [],
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: SubmitAction;
  initial?: Vac | null;
  title: string;
  presets?: string[];
  onDelete?: () => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
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

  const fe = !state?.ok ? state?.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {!initial && (
          <PresetChips
            presets={presets}
            onPick={(v) => {
              const el = formRef.current?.elements.namedItem("type");
              if (el instanceof HTMLInputElement) el.value = v;
            }}
          />
        )}
        <form ref={formRef} action={formAction} className="space-y-3">
          <VaccineFields initial={initial} presets={presets} errors={fe} />
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
        {onDelete && <DeleteZone label="Eliminar vacuna" onDelete={onDelete} />}
      </DialogContent>
    </Dialog>
  );
}
