"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Field } from "@/components/forms/field";
import { todayIso } from "@/lib/dates";
import {
  transactionCategoryLabels,
  type TransactionInput,
} from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";
import type { Transaction } from "@/db/schema";
import type { AnimalOption } from "@/lib/queries/animals-select";

type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult>;

type CategoryKey = TransactionInput["category"];
type TypeKey = TransactionInput["type"];

const expenseCategories: CategoryKey[] = [
  "pienso",
  "veterinario",
  "vacunas",
  "equipamiento",
  "otros",
];

const incomeCategories: CategoryKey[] = ["venta_animal", "venta_carne", "otros"];

export function TransactionForm({
  action,
  initial,
  sheepOptions,
  rabbitOptions,
  defaultSheepId,
  defaultRabbitId,
  submitLabel,
  cancelHref,
}: {
  action: SubmitAction;
  initial?: Transaction | null;
  sheepOptions: AnimalOption[];
  rabbitOptions: AnimalOption[];
  defaultSheepId?: number;
  defaultRabbitId?: number;
  submitLabel: string;
  cancelHref: string;
}) {
  const [type, setType] = useState<TypeKey>(initial?.type ?? "gasto");
  const [category, setCategory] = useState<CategoryKey>(
    initial?.category ??
      (initial?.type === "ingreso" ? "venta_animal" : "pienso"),
  );

  const initialKind: "" | "oveja" | "coneja" =
    initial?.animalKind ??
    (defaultSheepId ? "oveja" : defaultRabbitId ? "coneja" : "");
  const [animalKind, setAnimalKind] = useState<"" | "oveja" | "coneja">(
    initialKind,
  );

  const [state, formAction, isPending] = useActionState<
    ActionResult | null,
    FormData
  >(async (prev, fd) => {
    const res = await action(prev, fd);
    if (!res.ok) toast.error(res.error);
    return res;
  }, null);

  const fe = !state?.ok ? state?.fieldErrors : undefined;
  const categories = type === "ingreso" ? incomeCategories : expenseCategories;

  function handleSelectType(next: TypeKey) {
    setType(next);
    // Si la categoría actual no aplica al nuevo tipo, ajusta a la primera del lado
    const list = next === "ingreso" ? incomeCategories : expenseCategories;
    if (!list.includes(category)) setCategory(list[0]);
  }

  return (
    <form action={formAction} className="space-y-4">
      {/* Toggle ingreso/gasto */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-1">
        <button
          type="button"
          onClick={() => handleSelectType("gasto")}
          className={cn(
            "h-11 rounded-md text-sm font-medium transition-colors",
            type === "gasto"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground",
          )}
        >
          Gasto
        </button>
        <button
          type="button"
          onClick={() => handleSelectType("ingreso")}
          className={cn(
            "h-11 rounded-md text-sm font-medium transition-colors",
            type === "ingreso"
              ? "bg-background text-foreground shadow"
              : "text-muted-foreground",
          )}
        >
          Ingreso
        </button>
      </div>
      <input type="hidden" name="type" value={type} />

      {/* Presets de categoría */}
      <Field label="Categoría" required error={fe?.category}>
        <div className="grid grid-cols-2 gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "h-11 rounded-lg border text-sm font-medium transition-colors active:scale-[0.98]",
                category === c
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-input bg-background hover:bg-accent",
              )}
            >
              {transactionCategoryLabels[c]}
            </button>
          ))}
        </div>
        <input type="hidden" name="category" value={category} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" htmlFor="date" required error={fe?.date}>
          <Input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={initial?.date ?? todayIso()}
          />
        </Field>
        <Field
          label="Importe (€)"
          htmlFor="amountEur"
          required
          error={fe?.amountEur}
        >
          <Input
            id="amountEur"
            name="amountEur"
            type="number"
            step="0.01"
            min={0}
            inputMode="decimal"
            required
            defaultValue={initial?.amountEur ?? ""}
            placeholder="0,00"
          />
        </Field>
      </div>

      <Field
        label="Descripción"
        htmlFor="description"
        error={fe?.description}
      >
        <Textarea
          id="description"
          name="description"
          rows={2}
          defaultValue={initial?.description ?? ""}
          placeholder="(opcional)"
        />
      </Field>

      <Field label="Animal vinculado" htmlFor="animalKind">
        <NativeSelect
          id="animalKind"
          name="animalKind"
          value={animalKind}
          onChange={(e) =>
            setAnimalKind(e.target.value as "" | "oveja" | "coneja")
          }
        >
          <option value="">Sin vínculo</option>
          <option value="oveja">Oveja</option>
          <option value="coneja">Coneja</option>
        </NativeSelect>
      </Field>

      {animalKind === "oveja" && (
        <Field label="Oveja" htmlFor="sheepId">
          <NativeSelect
            id="sheepId"
            name="sheepId"
            defaultValue={
              initial?.sheepId?.toString() ?? defaultSheepId?.toString() ?? ""
            }
          >
            <option value="">— elige una —</option>
            {sheepOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}

      {animalKind === "coneja" && (
        <Field label="Coneja" htmlFor="rabbitId">
          <NativeSelect
            id="rabbitId"
            name="rabbitId"
            defaultValue={
              initial?.rabbitId?.toString() ??
              defaultRabbitId?.toString() ??
              ""
            }
          >
            <option value="">— elige una —</option>
            {rabbitOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" size="lg" className="flex-1" disabled={isPending}>
          {isPending ? "Guardando…" : submitLabel}
        </Button>
        <Button asChild type="button" variant="outline" size="lg">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
