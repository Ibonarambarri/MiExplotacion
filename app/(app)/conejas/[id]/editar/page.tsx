import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AnimalForm } from "@/components/forms/animal-form";
import { BackLink } from "@/components/animal/back-link";
import { getRabbitById } from "@/lib/queries/rabbits";
import { listMotherOptions } from "@/lib/queries/animals-select";
import { updateRabbitAction } from "@/actions/rabbits";

export const dynamic = "force-dynamic";

export default async function EditarConejaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const rabbitId = Number(id);
  if (!Number.isInteger(rabbitId)) notFound();
  const [animal, motherOptions] = await Promise.all([
    getRabbitById(rabbitId),
    listMotherOptions("coneja", rabbitId),
  ]);
  if (!animal) notFound();

  const action = updateRabbitAction.bind(null, rabbitId);
  const back = `/conejas/${rabbitId}?tab=datos`;

  return (
    <div>
      <BackLink href={back} label={animal.nickname || animal.tagId} />
      <PageHeader title="Editar coneja" />
      <AnimalForm
        action={action}
        initial={{ ...animal, photo: null, photoThumb: null }}
        submitLabel="Guardar cambios"
        cancelHref={back}
        tagLabel="Identificador"
        tagPlaceholder="C-001"
        motherOptions={motherOptions}
      />
    </div>
  );
}
