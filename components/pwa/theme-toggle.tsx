"use client";

import { useState, useTransition } from "react";
import { Segmented } from "@/components/ui/segmented";
import { setThemeAction, type ThemeChoice } from "@/actions/theme";

const OPTIONS: { value: ThemeChoice; label: string }[] = [
  { value: "system", label: "Sistema" },
  { value: "light", label: "Claro" },
  { value: "dark", label: "Oscuro" },
];

/** Selector de tema: aplica al instante y guarda la cookie en el servidor. */
export function ThemeToggle({ initial }: { initial: ThemeChoice }) {
  const [value, setValue] = useState<ThemeChoice>(initial);
  const [, startTransition] = useTransition();

  function change(next: ThemeChoice) {
    setValue(next);
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    startTransition(() => setThemeAction(next));
  }

  return (
    <Segmented
      aria-label="Tema de la app"
      value={value}
      onChange={change}
      options={OPTIONS}
      size="lg"
    />
  );
}
