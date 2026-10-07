import {
  Beef,
  Ellipsis,
  Stethoscope,
  Syringe,
  Tag,
  Wheat,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { RowIcon } from "@/components/ui/list";
import { transactionCategoryLabels } from "@/lib/validations";
import type { TxCategory } from "@/lib/queries/transactions";

export type CategoryTone = "harvest" | "info" | "success" | "muted";

export const CATEGORY_META: Record<
  TxCategory,
  { label: string; icon: LucideIcon; tone: CategoryTone }
> = {
  pienso: { label: transactionCategoryLabels.pienso, icon: Wheat, tone: "harvest" },
  veterinario: {
    label: transactionCategoryLabels.veterinario,
    icon: Stethoscope,
    tone: "info",
  },
  vacunas: { label: transactionCategoryLabels.vacunas, icon: Syringe, tone: "info" },
  equipamiento: {
    label: transactionCategoryLabels.equipamiento,
    icon: Wrench,
    tone: "muted",
  },
  venta_animal: {
    label: transactionCategoryLabels.venta_animal,
    icon: Tag,
    tone: "success",
  },
  venta_carne: {
    label: transactionCategoryLabels.venta_carne,
    icon: Beef,
    tone: "success",
  },
  otros: { label: transactionCategoryLabels.otros, icon: Ellipsis, tone: "muted" },
};

export const EXPENSE_CATEGORIES: TxCategory[] = [
  "pienso",
  "veterinario",
  "vacunas",
  "equipamiento",
  "otros",
];

export const INCOME_CATEGORIES: TxCategory[] = [
  "venta_animal",
  "venta_carne",
  "otros",
];

export const ALL_CATEGORIES: TxCategory[] = [
  "pienso",
  "veterinario",
  "vacunas",
  "equipamiento",
  "venta_animal",
  "venta_carne",
  "otros",
];

/** Clases de color de texto por tono (para iconos sueltos). */
export const TONE_TEXT: Record<CategoryTone, string> = {
  harvest: "text-harvest",
  info: "text-info",
  success: "text-success",
  muted: "text-muted-foreground",
};

export function CategoryIcon({
  category,
  className,
}: {
  category: TxCategory;
  className?: string;
}) {
  const meta = CATEGORY_META[category];
  const Icon = meta.icon;
  return (
    <RowIcon tone={meta.tone} className={className}>
      <Icon aria-hidden />
    </RowIcon>
  );
}
