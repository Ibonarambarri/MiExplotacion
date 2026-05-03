import { Badge } from "@/components/ui/badge";
import {
  animalStatusLabels,
  type AnimalStatus,
} from "@/lib/validations";

const variantMap: Record<
  AnimalStatus,
  "success" | "secondary" | "destructive" | "warning"
> = {
  activo: "success",
  vendido: "secondary",
  muerto: "destructive",
  sacrificado: "warning",
};

export function StatusBadge({ status }: { status: AnimalStatus }) {
  return (
    <Badge variant={variantMap[status]}>{animalStatusLabels[status]}</Badge>
  );
}
