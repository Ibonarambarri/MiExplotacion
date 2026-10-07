"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ArrowUpRight, Sprout } from "lucide-react";
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
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/forms/field";
import { DeleteZone } from "@/components/animal/delete-zone";
import { toastSale } from "@/components/animal/undo-toast";
import type { SaleSync } from "@/actions/sheep-sales";
import { todayIso } from "@/lib/dates";
import { lambStatusLabels } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";
import type { Lamb } from "@/db/schema";

type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult<{ sale: SaleSync }>>;

export function LambFormDialog({
  open,
  onOpenChange,
  action,
  initial,
  title,
  onDelete,
  onPromote,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  action: SubmitAction;
  initial?: Lamb | null;
  title: string;
  onDelete?: () => Promise<void>;
  /** Solo para corderas vivas aún no pasadas al rebaño. */
  onPromote?: () => void;
}) {
  const [status, setStatus] = useState<string>(initial?.status ?? "vivo");

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (prev, fd) => {
    const res = await action(prev, fd);
    if (res.ok) {
      toast.success("Cordero guardado");
      toastSale(res.data?.sale);
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="Sexo" htmlFor="gender" error={fe?.gender}>
              <NativeSelect
                id="gender"
                name="gender"
                defaultValue={initial?.gender ?? ""}
              >
                <option value="">—</option>
                <option value="macho">Macho</option>
                <option value="hembra">Hembra</option>
              </NativeSelect>
            </Field>
            <Field label="Apodo" htmlFor="nickname" error={fe?.nickname}>
              <Input
                id="nickname"
                name="nickname"
                defaultValue={initial?.nickname ?? ""}
              />
            </Field>
          </div>

          <Field label="Estado" htmlFor="status" required error={fe?.status}>
            <NativeSelect
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {Object.entries(lambStatusLabels).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </NativeSelect>
          </Field>

          {status === "sacrificado" && (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Fecha sacrificio"
                htmlFor="slaughterDate"
                error={fe?.slaughterDate}
              >
                <Input
                  id="slaughterDate"
                  name="slaughterDate"
                  type="date"
                  defaultValue={initial?.slaughterDate ?? todayIso()}
                />
              </Field>
              <Field
                label="Peso muerto (kg)"
                htmlFor="deadWeightKg"
                error={fe?.deadWeightKg}
              >
                <Input
                  id="deadWeightKg"
                  name="deadWeightKg"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={initial?.deadWeightKg ?? ""}
                />
              </Field>
            </div>
          )}

          {status === "vendido" && (
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Fecha venta"
                htmlFor="saleDate"
                error={fe?.saleDate}
              >
                <Input
                  id="saleDate"
                  name="saleDate"
                  type="date"
                  defaultValue={initial?.saleDate ?? todayIso()}
                />
              </Field>
              <Field
                label="Precio (€)"
                htmlFor="salePriceEur"
                hint="Se apunta como ingreso en Finanzas."
                error={fe?.salePriceEur}
              >
                <Input
                  id="salePriceEur"
                  name="salePriceEur"
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  defaultValue={initial?.salePriceEur ?? ""}
                />
              </Field>
            </div>
          )}

          {status === "muerto_natural" && (
            <Field
              label="Fecha (referencia)"
              htmlFor="slaughterDate"
              hint="Se usa como fecha de baja del cordero."
              error={fe?.slaughterDate}
            >
              <Input
                id="slaughterDate"
                name="slaughterDate"
                type="date"
                defaultValue={initial?.slaughterDate ?? todayIso()}
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
        {initial?.promotedSheepId ? (
          <Button asChild variant="secondary" className="w-full">
            <Link href={`/ovejas/${initial.promotedSheepId}`}>
              Ver su ficha en el rebaño
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
        ) : onPromote ? (
          <Button type="button" variant="secondary" className="w-full" onClick={onPromote}>
            <Sprout className="h-4 w-4" aria-hidden />
            Pasar al rebaño
          </Button>
        ) : null}
        {onDelete && (
          <DeleteZone
            label="Eliminar cordero"
            confirmText={
              initial?.status === "vendido" && initial.salePriceEur
                ? "Se quitará también su ingreso de Finanzas. Podrás deshacerlo unos segundos."
                : undefined
            }
            onDelete={onDelete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
