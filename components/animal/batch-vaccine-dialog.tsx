"use client";

import { useActionState, useRef } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VaccineFields, PresetChips } from "@/components/animal/vaccine-fields";
import { batchVaccinateAction } from "@/actions/batch";
import type { ActionResult } from "@/actions/sheep";

/** Sheet de vacunación / desparasitación para varios animales a la vez. */
export function BatchVaccineDialog({
  kind,
  ids,
  open,
  onOpenChange,
  presets,
  onDone,
}: {
  kind: "oveja" | "coneja";
  ids: number[];
  open: boolean;
  onOpenChange: (v: boolean) => void;
  presets: string[];
  onDone: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const many = kind === "oveja" ? "ovejas" : "conejas";
  const one = kind === "oveja" ? "oveja" : "coneja";

  const [state, formAction, isPending] = useActionState<
    ActionResult<{ count: number }> | null,
    FormData
  >(async (prev, fd) => {
    const res = await batchVaccinateAction(kind, ids, prev, fd);
    if (res.ok) {
      const n = res.data?.count ?? ids.length;
      toast.success(`Registrada en ${n} ${n === 1 ? one : many}`);
      onDone();
    } else {
      toast.error(res.error);
    }
    return res;
  }, null);

  const fe = state && !state.ok ? state.fieldErrors : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vacunar / desparasitar</DialogTitle>
          <DialogDescription className="tabular">
            Se apuntará a {ids.length} {ids.length === 1 ? one : many}.
          </DialogDescription>
        </DialogHeader>
        <PresetChips
          presets={presets}
          onPick={(v) => {
            const el = formRef.current?.elements.namedItem("type");
            if (el instanceof HTMLInputElement) el.value = v;
          }}
        />
        <form ref={formRef} action={formAction} className="space-y-3">
          <VaccineFields presets={presets} errors={fe} />
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || ids.length === 0}>
              {isPending ? "Guardando…" : `Guardar (${ids.length})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
