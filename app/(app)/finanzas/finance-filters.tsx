"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { NativeSelect } from "@/components/ui/native-select";
import {
  transactionCategoryLabels,
  type TransactionInput,
} from "@/lib/validations";

const MONTHS_ES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

type CategoryKey = TransactionInput["category"];

export function FinanceFilters({
  year,
  month,
  type,
  category,
  years,
}: {
  year: number;
  month: number | null;
  type: "all" | "ingreso" | "gasto";
  category: "all" | CategoryKey;
  years: number[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [, startTransition] = useTransition();

  function update(patch: Record<string, string | null>) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") params.delete(k);
      else params.set(k, v);
    }
    const qs = params.toString();
    startTransition(() => {
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    });
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <NativeSelect
        value={String(year)}
        onChange={(e) => update({ year: e.target.value })}
        aria-label="Año"
      >
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        value={month === null ? "all" : String(month)}
        onChange={(e) =>
          update({
            month: e.target.value === "all" ? null : e.target.value,
          })
        }
        aria-label="Mes"
      >
        <option value="all">Todo el año</option>
        {MONTHS_ES.map((label, i) => (
          <option key={label} value={i + 1}>
            {label}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect
        value={type}
        onChange={(e) => update({ type: e.target.value })}
        aria-label="Tipo"
      >
        <option value="all">Ingresos y gastos</option>
        <option value="ingreso">Sólo ingresos</option>
        <option value="gasto">Sólo gastos</option>
      </NativeSelect>
      <NativeSelect
        value={category}
        onChange={(e) => update({ category: e.target.value })}
        aria-label="Categoría"
      >
        <option value="all">Todas las categorías</option>
        {Object.entries(transactionCategoryLabels).map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
