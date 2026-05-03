import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AnimalForm } from "@/components/forms/animal-form";
import { getRabbitById } from "@/lib/queries/rabbits";
import { updateRabbitAction } from "@/actions/rabbits";

export default async function EditarConejaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rabbitId = Number(id);
  if (!Number.isFinite(rabbitId)) notFound();
  const animal = await getRabbitById(rabbitId);
  if (!animal) notFound();

  const action = updateRabbitAction.bind(null, rabbitId);

  return (
    <div>
      <PageHeader
        title="Editar coneja"
        description={animal.nickname || animal.tagId}
      />
      <AnimalForm
        action={action}
        initial={animal}
        submitLabel="Guardar cambios"
        cancelHref={`/conejas/${rabbitId}`}
        tagLabel="Identificador"
        tagPlaceholder="C-001"
      />
    </div>
  );
}
