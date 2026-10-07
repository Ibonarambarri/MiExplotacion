"use client";

import { useActionState, useState } from "react";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ListGroup, ListRow } from "@/components/ui/list";
import { Stat } from "@/components/ui/stat";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/forms/field";
import { WeightChart } from "@/components/animal/weight-chart";
import { DeleteZone } from "@/components/animal/delete-zone";
import { toastWithUndo } from "@/components/animal/undo-toast";
import {
  createWeightAction,
  deleteWeightAction,
  restoreWeightAction,
} from "@/actions/weights";
import { daysBetweenIso, todayIso } from "@/lib/dates";
import { formatDateEs } from "@/lib/utils";
import type { WeightPoint, WeightTarget } from "@/lib/queries/weights";
import type { ActionResult } from "@/actions/sheep";

const kg = (n: number, signed = false) =>
  `${signed && n > 0 ? "+" : ""}${n.toLocaleString("es-ES", { maximumFractionDigits: 2 })} kg`;

/** Pesos: alta rápida, resumen, gráfica y lista. Sirve para animal, cordero o camada. */
export function WeightsPanel({
  target,
  points,
  label = "Peso",
  compact = false,
}: {
  target: WeightTarget;
  points: WeightPoint[];
  /** "Peso" o "Peso medio" (camadas). */
  label?: string;
  compact?: boolean;
}) {
  const [formKey, setFormKey] = useState(0);
  const [selected, setSelected] = useState<WeightPoint | null>(null);
  const [state, formAction, isPending] = useActionState<ActionResult | null, FormData>(
    async (prev, fd) => {
      const res = await createWeightAction(target, prev, fd);
      if (res.ok) {
        toast.success("Pesaje guardado");
        setFormKey((k) => k + 1);
      } else {
        toast.error(res.error);
      }
      return res;
    },
    null,
  );
  const fe = state && !state.ok ? state.fieldErrors : undefined;

  const last = points.at(-1);
  const prev = points.at(-2);
  const first = points[0];
  const days = last && first ? daysBetweenIso(first.date, last.date) : 0;
  const gainPerDay =
    last && first && days > 0 ? ((last.weightKg - first.weightKg) / days) * 1000 : null;

  async function remove(p: WeightPoint) {
    const r = await deleteWeightAction(target, p.id);
    if (!r.ok) {
      toast.error(r.error);
      return;
    }
    setSelected(null);
    const row = r.data;
    toastWithUndo("Pesaje eliminado", async () =>
      row ? restoreWeightAction(target, row) : { ok: false, error: "Nada que deshacer" },
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form key={formKey} action={formAction} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
          <Field label="Fecha" htmlFor={`w-date-${target.kind}-${target.id}`} error={fe?.date}>
            <Input
              id={`w-date-${target.kind}-${target.id}`}
              name="date"
              type="date"
              required
              defaultValue={todayIso()}
            />
          </Field>
          <Field label={`${label} (kg)`} htmlFor={`w-kg-${target.kind}-${target.id}`} error={fe?.weightKg}>
            <Input
              id={`w-kg-${target.kind}-${target.id}`}
              name="weightKg"
              inputMode="decimal"
              autoComplete="off"
              required
              placeholder={last ? String(last.weightKg).replace(".", ",") : "0,0"}
              pattern="[0-9]+([.,][0-9]{1,2})?"
              title="Número con hasta 2 decimales"
            />
          </Field>
          <Button type="submit" disabled={isPending} className="mb-0">
            {isPending ? "…" : "Añadir"}
          </Button>
        </form>
      </Card>

      {points.length > 0 && (
        <Card className="space-y-3 p-4">
          <div className="grid grid-cols-3 gap-3">
            <Stat label={compact ? "Último" : `${label} actual`} value={last ? kg(last.weightKg) : "—"} />
            <Stat
              label="Cambio"
              value={last && prev ? kg(Math.round((last.weightKg - prev.weightKg) * 100) / 100, true) : "—"}
              tone={last && prev ? (last.weightKg >= prev.weightKg ? "positive" : "negative") : "default"}
            />
            <Stat
              label="Ganancia/día"
              value={gainPerDay !== null ? `${Math.round(gainPerDay)} g` : "—"}
              hint={days > 0 ? `en ${days} días` : undefined}
            />
          </div>
          <WeightChart points={points} />
        </Card>
      )}

      {points.length === 0 ? (
        !compact && (
          <p className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Scale className="h-4 w-4" aria-hidden />
            Aún no hay pesajes.
          </p>
        )
      ) : (
        <ListGroup title="Historial">
          {[...points].reverse().map((p, i, arr) => {
            const before = arr[i + 1];
            const diff = before ? Math.round((p.weightKg - before.weightKg) * 100) / 100 : null;
            return (
              <ListRow
                key={p.id}
                onClick={() => setSelected(p)}
                title={<span className="tabular">{kg(p.weightKg)}</span>}
                subtitle={[formatDateEs(p.date), p.notes].filter(Boolean).join(" · ")}
                trailing={
                  diff !== null && diff !== 0 ? (
                    <span
                      className={
                        diff > 0
                          ? "tabular text-sm font-medium text-success"
                          : "tabular text-sm font-medium text-destructive"
                      }
                    >
                      {kg(diff, true)}
                    </span>
                  ) : undefined
                }
              />
            );
          })}
        </ListGroup>
      )}

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="tabular">{selected ? kg(selected.weightKg) : ""}</DialogTitle>
            <DialogDescription>
              {selected ? `Pesaje del ${formatDateEs(selected.date)}` : ""}
              {selected?.notes ? ` · ${selected.notes}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selected && (
            <DeleteZone label="Eliminar pesaje" onDelete={() => remove(selected)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
