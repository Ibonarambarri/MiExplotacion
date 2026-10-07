"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/field";
import { todayIso } from "@/lib/dates";

/** Campos de vacuna/desparasitación, compartidos por el alta individual y el lote. */
export function VaccineFields({
  initial,
  presets = [],
  errors,
}: {
  initial?: {
    date?: string;
    type?: string;
    dose?: string | null;
    nextDoseDate?: string | null;
    vet?: string | null;
    notes?: string | null;
  } | null;
  presets?: string[];
  errors?: Record<string, string>;
}) {
  const uid = useId();
  const listId = `${uid}-presets`;
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha" htmlFor={`${uid}-date`} required error={errors?.date}>
          <Input
            id={`${uid}-date`}
            name="date"
            type="date"
            required
            defaultValue={initial?.date ?? todayIso()}
          />
        </Field>
        <Field label="Dosis" htmlFor={`${uid}-dose`} error={errors?.dose}>
          <Input
            id={`${uid}-dose`}
            name="dose"
            defaultValue={initial?.dose ?? ""}
            placeholder="2 ml"
            autoComplete="off"
          />
        </Field>
      </div>
      <Field label="Tipo" htmlFor={`${uid}-type`} required error={errors?.type}>
        <Input
          id={`${uid}-type`}
          name="type"
          required
          list={listId}
          autoComplete="off"
          defaultValue={initial?.type ?? ""}
          placeholder="p. ej. Enterotoxemia"
        />
        <datalist id={listId}>
          {presets.map((p) => (
            <option key={p} value={p} />
          ))}
        </datalist>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Próxima dosis"
          htmlFor={`${uid}-next`}
          error={errors?.nextDoseDate}
        >
          <Input
            id={`${uid}-next`}
            name="nextDoseDate"
            type="date"
            defaultValue={initial?.nextDoseDate ?? ""}
          />
        </Field>
        <Field label="Veterinario" htmlFor={`${uid}-vet`} error={errors?.vet}>
          <Input
            id={`${uid}-vet`}
            name="vet"
            autoComplete="off"
            defaultValue={initial?.vet ?? ""}
          />
        </Field>
      </div>
      <Field label="Notas" htmlFor={`${uid}-notes`} error={errors?.notes}>
        <Textarea
          id={`${uid}-notes`}
          name="notes"
          rows={2}
          defaultValue={initial?.notes ?? ""}
        />
      </Field>
    </>
  );
}

/** Chips de tipos frecuentes: rellenan el campo "Tipo" con un toque. */
export function PresetChips({
  presets,
  onPick,
}: {
  presets: string[];
  onPick: (v: string) => void;
}) {
  if (!presets.length) return null;
  return (
    <div className="scrollbar-none -mx-5 flex gap-2 overflow-x-auto px-5">
      {presets.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPick(p)}
          className="pressable h-9 shrink-0 rounded-full border border-border bg-card px-3 text-sm font-medium"
        >
          {p}
        </button>
      ))}
    </div>
  );
}
