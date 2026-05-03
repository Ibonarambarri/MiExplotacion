import { PageHeader } from "@/components/page-header";
import { AnimalForm } from "@/components/forms/animal-form";
import { createSheepAction } from "@/actions/sheep";

export const metadata = { title: "Nueva oveja · Acienda" };

export default function NuevaOvejaPage() {
  return (
    <div>
      <PageHeader title="Nueva oveja" description="Alta de animal" />
      <AnimalForm
        action={createSheepAction}
        submitLabel="Crear oveja"
        cancelHref="/ovejas"
      />
    </div>
  );
}
