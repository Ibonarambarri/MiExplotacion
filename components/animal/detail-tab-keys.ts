// Compartido entre servidor y cliente (sin "use client").
export const DETAIL_TABS = [
  { key: "resumen", label: "Resumen" },
  { key: "salud", label: "Salud" },
  { key: "crias", label: "Crías" },
  { key: "pesos", label: "Pesos" },
  { key: "datos", label: "Datos" },
  { key: "gastos", label: "Gastos" },
] as const;

export type DetailTab = (typeof DETAIL_TABS)[number]["key"];

export function parseDetailTab(v: string | undefined): DetailTab {
  return DETAIL_TABS.some((t) => t.key === v) ? (v as DetailTab) : "resumen";
}
