import { Badge } from "@/components/ui/badge";
import { lambStatusLabels } from "@/lib/validations";
import type { Lamb } from "@/db/schema";

const variantMap: Record<
  Lamb["status"],
  "success" | "warning" | "destructive" | "secondary"
> = {
  vivo: "success",
  sacrificado: "warning",
  muerto_natural: "destructive",
  vendido: "secondary",
};

export function LambStatusBadge({ status }: { status: Lamb["status"] }) {
  return <Badge variant={variantMap[status]}>{lambStatusLabels[status]}</Badge>;
}
