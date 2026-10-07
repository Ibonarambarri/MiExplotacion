"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import { DETAIL_TABS, type DetailTab } from "@/components/animal/detail-tab-keys";

export { DETAIL_TABS, parseDetailTab, type DetailTab } from "@/components/animal/detail-tab-keys";

/**
 * Pestañas de la ficha como control segmentado desplazable. La pestaña vive
 * en la URL (?tab=…) para que "atrás" desde una crianza vuelva a la misma;
 * se actualiza con replaceState para no volver a pedir la página.
 */
export function DetailTabs({
  initial,
  panels,
}: {
  initial: DetailTab;
  panels: Record<DetailTab, React.ReactNode>;
}) {
  const [tab, setTab] = useState<DetailTab>(initial);
  const listRef = useRef<HTMLDivElement>(null);

  // Mantiene visible la pestaña activa dentro de la fila desplazable
  // (sin mover la página en vertical).
  useEffect(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
    if (!list || !el) return;
    const left = el.offsetLeft - list.offsetLeft - list.clientWidth / 2 + el.clientWidth / 2;
    list.scrollTo({ left, behavior: "smooth" });
  }, [tab]);

  function select(next: DetailTab) {
    setTab(next);
    const url = new URL(window.location.href);
    if (next === "resumen") url.searchParams.delete("tab");
    else url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const i = DETAIL_TABS.findIndex((t) => t.key === tab);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % DETAIL_TABS.length;
    if (e.key === "ArrowLeft") n = (i - 1 + DETAIL_TABS.length) % DETAIL_TABS.length;
    if (n >= 0) {
      e.preventDefault();
      select(DETAIL_TABS[n].key);
      listRef.current?.querySelector<HTMLElement>(`[data-tab="${DETAIL_TABS[n].key}"]`)?.focus();
    }
  }

  return (
    <div>
      <div className="sticky top-[env(safe-area-inset-top,0px)] z-20 -mx-4 bg-background/90 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/75">
        <div
          ref={listRef}
          role="tablist"
          aria-label="Secciones de la ficha"
          onKeyDown={onKeyDown}
          className="scrollbar-none flex gap-1 overflow-x-auto rounded-xl bg-muted p-1"
        >
          {DETAIL_TABS.map((t) => {
            const active = t.key === tab;
            return (
              <button
                key={t.key}
                data-tab={t.key}
                type="button"
                role="tab"
                id={`tab-${t.key}`}
                aria-selected={active}
                aria-controls={`panel-${t.key}`}
                tabIndex={active ? 0 : -1}
                onClick={() => select(t.key)}
                className={cn(
                  "h-9 shrink-0 grow rounded-lg px-3.5 text-sm font-medium transition-[background-color,color,box-shadow] duration-200",
                  active
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground active:bg-card/50",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      {DETAIL_TABS.map((t) =>
        t.key === tab ? (
          <div
            key={t.key}
            role="tabpanel"
            id={`panel-${t.key}`}
            aria-labelledby={`tab-${t.key}`}
            className="pt-3 animate-in fade-in-0 duration-200"
          >
            {panels[t.key]}
          </div>
        ) : null,
      )}
    </div>
  );
}
