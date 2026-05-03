import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AnimalForm } from "@/components/forms/animal-form";
import { getSheepById } from "@/lib/queries/sheep";
import { updateSheepAction } from "@/actions/sheep";

export default async function EditarOvejaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheepId = Number(id);
  if (!Number.isFinite(sheepId)) notFound();
  const animal = await getSheepById(sheepId);
  if (!animal) notFound();

  const action = updateSheepAction.bind(null, sheepId);

  return (
    <div>
      <PageHeader
        title="Editar oveja"
        description={animal.nickname || animal.tagId}
      />
      <AnimalForm
        action={action}
        initial={animal}
        submitLabel="Guardar cambios"
        cancelHref={`/ovejas/${sheepId}`}
      />
    </div>
  );
}
