import { PageHeader } from "@/components/page-header";
import { AnimalForm } from "@/components/forms/animal-form";
import { createRabbitAction } from "@/actions/rabbits";

export const metadata = { title: "Nueva coneja · Acienda" };

export default function NuevaConejaPage() {
  return (
    <div>
      <PageHeader title="Nueva coneja" description="Alta de animal" />
      <AnimalForm
        action={createRabbitAction}
        submitLabel="Crear coneja"
        cancelHref="/conejas"
        tagLabel="Identificador"
        tagPlaceholder="C-001"
      />
    </div>
  );
}
