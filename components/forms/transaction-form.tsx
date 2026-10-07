"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import { Segmented } from "@/components/ui/segmented";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { Field } from "@/components/forms/field";
import {
  CATEGORY_META,
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  TONE_TEXT,
} from "@/components/finance/category-meta";
import { addDaysIso, todayIso } from "@/lib/dates";
import type { TransactionInput } from "@/lib/validations";
import type { ActionResult } from "@/actions/sheep";
import type { Transaction } from "@/db/schema";
import type { AnimalOption } from "@/lib/queries/animals-select";

type SubmitAction = (
  prev: ActionResult | null,
  fd: FormData,
) => Promise<ActionResult>;

type CategoryKey = TransactionInput["category"];
type TypeKey = TransactionInput["type"];
type AnimalKind = "" | "oveja" | "coneja";
type DateChoice = "hoy" | "ayer" | "otra";

/** Limpia lo tecleado: dígitos y una coma decimal con hasta 2 decimales. */
function sanitizeAmount(raw: string): string {
  let s = raw.replace(/\./g, ",").replace(/[^\d,]/g, "");
  const i = s.indexOf(",");
  if (i !== -1) {
    s = s.slice(0, i + 1) + s.slice(i + 1).replace(/,/g, "").slice(0, 2);
  }
  // Sin ceros a la izquierda innecesarios ("007" → "7", "0,5" se mantiene).
  s = s.replace(/^0+(?=\d)/, "");
  if (s.startsWith(",")) s = `0${s}`;
  return s.slice(0, 12);
}

/** "12,5" → "12.5"; "12," → "12". Lo que espera el servidor. */
function toServerAmount(display: string): string {
  return display.replace(/,$/, "").replace(",", ".");
}

export function TransactionForm({
  action,
  initial,
  sheepOptions,
  rabbitOptions,
  defaultSheepId,
  defaultRabbitId,
  defaultType,
  submitLabel,
  cancelHref,
}: {
  action: SubmitAction;
  initial?: Transaction | null;
  sheepOptions: AnimalOption[];
  rabbitOptions: AnimalOption[];
  defaultSheepId?: number;
  defaultRabbitId?: number;
  /** Tipo inicial (p. ej. desde ?type=ingreso en /finanzas/nuevo). */
  defaultType?: TypeKey;
  submitLabel: string;
  cancelHref: string;
}) {
  const [today] = useState(() => todayIso());
  const yesterday = addDaysIso(today, -1);

  const startType: TypeKey = initial?.type ?? defaultType ?? "gasto";
  const [type, setType] = useState<TypeKey>(startType);
  const [category, setCategory] = useState<CategoryKey>(
    initial?.category ?? (startType === "ingreso" ? "venta_animal" : "pienso"),
  );
  const [amount, setAmount] = useState(() =>
    initial?.amountEur
      ? sanitizeAmount(Number(initial.amountEur).toFixed(2))
      : "",
  );

  const initialDate = initial?.date ?? today;
  const [date, setDate] = useState(initialDate);
  const [dateChoice, setDateChoice] = useState<DateChoice>(
    initialDate === today ? "hoy" : initialDate === yesterday ? "ayer" : "otra",
  );

  const [animalKind, setAnimalKind] = useState<AnimalKind>(
    initial?.animalKind ??
      (defaultSheepId ? "oveja" : defaultRabbitId ? "coneja" : ""),
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
  const categories = type === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function handleSelectType(next: TypeKey) {
    setType(next);
    const list = next === "ingreso" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    if (!list.includes(category)) setCategory(list[0]);
  }

  function chooseDate(choice: DateChoice) {
    setDateChoice(choice);
    if (choice === "hoy") setDate(today);
    if (choice === "ayer") setDate(yesterday);
  }

  // Si el animal vinculado ya no está activo, no aparece en las opciones:
  // lo añadimos para no perder el vínculo al guardar.
  const sheepOpts = withCurrent(sheepOptions, initial?.sheepId);
  const rabbitOpts = withCurrent(rabbitOptions, initial?.rabbitId);

  const amountValid = /^\d+(,\d{1,2})?,?$/.test(amount) && Number(toServerAmount(amount)) > 0;

  return (
    <form action={formAction} className="space-y-6">
      {/* Tipo + importe */}
      <div className="space-y-4 rounded-3xl border border-border/60 bg-card p-4 shadow-[0_1px_2px_rgb(0_0_0/0.04)]">
        <Segmented
          aria-label="Tipo de movimiento"
          size="lg"
          value={type}
          onChange={handleSelectType}
          options={[
            { value: "gasto", label: "Gasto" },
            { value: "ingreso", label: "Ingreso" },
          ]}
        />
        <input type="hidden" name="type" value={type} />

        <div className="text-center">
          <label
            htmlFor="amountEur"
            className="text-xs font-medium text-muted-foreground"
          >
            Importe
          </label>
          <div
            className={cn(
              "mt-1 flex items-baseline justify-center gap-1",
              type === "ingreso" ? "text-success" : "text-foreground",
            )}
          >
            <span aria-hidden className="text-3xl font-semibold text-muted-foreground">
              {type === "ingreso" ? "+" : "−"}
            </span>
            <input
              id="amountEur"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              enterKeyHint="next"
              autoFocus={!initial}
              required
              value={amount}
              onChange={(e) => setAmount(sanitizeAmount(e.target.value))}
              placeholder="0"
              aria-invalid={!!fe?.amountEur}
              aria-describedby={fe?.amountEur ? "amount-error" : undefined}
              className="tabular w-full min-w-0 max-w-[9ch] bg-transparent text-center text-5xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/40"
              style={{ width: `${Math.max(1, amount.length) + 0.5}ch` }}
            />
            <span aria-hidden className="text-3xl font-semibold text-muted-foreground">
              €
            </span>
          </div>
          <input type="hidden" name="amountEur" value={toServerAmount(amount)} />
          {fe?.amountEur && (
            <p id="amount-error" className="mt-1 text-xs text-destructive">
              {fe.amountEur}
            </p>
          )}
        </div>
      </div>

      {/* Categoría */}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Categoría</legend>
        <div className="grid grid-cols-3 gap-2">
          {categories.map((c) => {
            const meta = CATEGORY_META[c];
            const Icon = meta.icon;
            const active = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(c)}
                className={cn(
                  "pressable flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border px-2 py-3 text-[13px] font-medium",
                  active
                    ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary"
                    : "border-border bg-card text-foreground",
                )}
              >
                <Icon
                  className={cn("h-6 w-6", active ? "text-primary" : TONE_TEXT[meta.tone])}
                  aria-hidden
                />
                <span className="text-center leading-tight">{meta.label}</span>
              </button>
            );
          })}
        </div>
        <input type="hidden" name="category" value={category} />
        {fe?.category && <p className="text-xs text-destructive">{fe.category}</p>}
      </fieldset>

      {/* Fecha */}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Fecha</legend>
        <ChipGroup label="Fecha rápida" className="mx-0 px-0">
          <Chip active={dateChoice === "hoy"} onClick={() => chooseDate("hoy")} className="h-11 px-5">
            Hoy
          </Chip>
          <Chip active={dateChoice === "ayer"} onClick={() => chooseDate("ayer")} className="h-11 px-5">
            Ayer
          </Chip>
          <Chip active={dateChoice === "otra"} onClick={() => chooseDate("otra")} className="h-11 px-5">
            Otra
          </Chip>
        </ChipGroup>
        {dateChoice === "otra" && (
          <Input
            type="date"
            aria-label="Fecha del movimiento"
            required
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="animate-in fade-in-0 slide-in-from-top-1 duration-200"
          />
        )}
        <input type="hidden" name="date" value={date} />
        {fe?.date && <p className="text-xs text-destructive">{fe.date}</p>}
      </fieldset>

      <Field label="Descripción" htmlFor="description" error={fe?.description}>
        <Input
          id="description"
          name="description"
          defaultValue={initial?.description ?? ""}
          placeholder="Opcional, p. ej. «Saco de pienso 25 kg»"
          maxLength={1000}
          enterKeyHint="done"
        />
      </Field>

      {/* Animal */}
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium">Animal vinculado</legend>
        <Segmented
          aria-label="Tipo de animal"
          value={animalKind === "" ? "none" : animalKind}
          onChange={(v) => setAnimalKind(v === "none" ? "" : v)}
          options={[
            { value: "none", label: "Ninguno" },
            { value: "oveja", label: "Oveja" },
            { value: "coneja", label: "Coneja" },
          ]}
        />
        {animalKind && <input type="hidden" name="animalKind" value={animalKind} />}

        {animalKind === "oveja" && (
          <NativeSelect
            name="sheepId"
            aria-label="Oveja"
            defaultValue={
              initial?.sheepId?.toString() ?? defaultSheepId?.toString() ?? ""
            }
          >
            <option value="">Elige una oveja</option>
            {sheepOpts.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        )}

        {animalKind === "coneja" && (
          <NativeSelect
            name="rabbitId"
            aria-label="Coneja"
            defaultValue={
              initial?.rabbitId?.toString() ?? defaultRabbitId?.toString() ?? ""
            }
          >
            <option value="">Elige una coneja</option>
            {rabbitOpts.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </NativeSelect>
        )}
      </fieldset>

      {/* Barra de acciones fija sobre la navegación inferior */}
      <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom,0px))] z-20 -mx-4 flex gap-2 border-t border-border/60 bg-background/90 px-4 pt-3 pb-3 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <Button asChild type="button" variant="outline" size="lg">
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
        <Button
          type="submit"
          size="lg"
          className="flex-1"
          disabled={isPending || !amountValid}
        >
          {isPending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}

function withCurrent(options: AnimalOption[], id: number | null | undefined) {
  if (!id || options.some((o) => o.id === id)) return options;
  return [{ id, label: `#${id}` }, ...options];
}
