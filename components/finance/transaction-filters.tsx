"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import type { TxCategory, TxType } from "@/lib/queries/transactions";
import { ALL_CATEGORIES, CATEGORY_META } from "./category-meta";
import { withParams } from "./period";

export function TransactionFilters({
  type,
  category,
  q,
  counts,
}: {
  type: TxType | "all";
  category: TxCategory | "all";
  q: string;
  /** Nº de movimientos del periodo por tipo y categoría (para los chips). */
  counts: {
    all: number;
    gasto: number;
    ingreso: number;
    byCategory: Partial<Record<TxCategory, number>>;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [text, setText] = useState(q);
  const lastSent = useRef(q);

  function update(patch: Record<string, string | null>) {
    startTransition(() => {
      router.replace(`${pathname}${withParams(sp, patch)}`, { scroll: false });
    });
  }

  // Búsqueda con debounce para no navegar en cada pulsación.
  useEffect(() => {
    const value = text.trim();
    if (value === lastSent.current) return;
    const t = setTimeout(() => {
      lastSent.current = value;
      startTransition(() => {
        router.replace(`${pathname}${withParams(sp, { q: value || null })}`, {
          scroll: false,
        });
      });
    }, 300);
    return () => clearTimeout(t);
  }, [text, pathname, router, sp]);

  const none = type === "all" && category === "all";
  const visibleCategories = ALL_CATEGORIES.filter(
    (c) => (counts.byCategory[c] ?? 0) > 0 || c === category,
  );

  return (
    <div className={cn("space-y-3 transition-opacity", pending && "opacity-70")}>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        className="relative"
      >
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Buscar en descripciones"
          aria-label="Buscar movimientos por descripción"
          className="h-11 w-full rounded-xl border border-border bg-card pl-10 pr-11 text-base outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-search-cancel-button]:hidden"
        />
        {text && (
          <button
            type="button"
            onClick={() => setText("")}
            aria-label="Borrar búsqueda"
            className="pressable absolute right-0 top-0 inline-flex h-11 w-11 items-center justify-center text-muted-foreground"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        )}
      </form>

      <ChipGroup label="Filtrar movimientos">
        <Chip
          active={none}
          count={counts.all}
          onClick={() => update({ type: null, category: null })}
        >
          Todos
        </Chip>
        <Chip
          active={type === "gasto" && category === "all"}
          count={counts.gasto}
          onClick={() => update({ type: "gasto", category: null })}
        >
          Gastos
        </Chip>
        <Chip
          active={type === "ingreso" && category === "all"}
          count={counts.ingreso}
          onClick={() => update({ type: "ingreso", category: null })}
        >
          Ingresos
        </Chip>
        {visibleCategories.map((c) => {
          const Icon = CATEGORY_META[c].icon;
          return (
            <Chip
              key={c}
              active={category === c}
              count={counts.byCategory[c] ?? 0}
              icon={<Icon aria-hidden />}
              onClick={() =>
                update({ category: category === c ? null : c, type: null })
              }
            >
              {CATEGORY_META[c].label}
            </Chip>
          );
        })}
      </ChipGroup>
    </div>
  );
}
