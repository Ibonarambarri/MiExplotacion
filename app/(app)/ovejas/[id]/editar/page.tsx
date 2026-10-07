import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { AnimalForm } from "@/components/forms/animal-form";
import { BackLink } from "@/components/animal/back-link";
import { getSheepById } from "@/lib/queries/sheep";
import { listMotherOptions } from "@/lib/queries/animals-select";
import { updateSheepAction } from "@/actions/sheep";

export const dynamic = "force-dynamic";

export default async function EditarOvejaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sheepId = Number(id);
  if (!Number.isInteger(sheepId)) notFound();
  const [animal, motherOptions] = await Promise.all([
    getSheepById(sheepId),
    listMotherOptions("oveja", sheepId),
  ]);
  if (!animal) notFound();

  const action = updateSheepAction.bind(null, sheepId);
  const back = `/ovejas/${sheepId}?tab=datos`;

  return (
    <div>
      <BackLink href={back} label={animal.nickname || animal.tagId} />
      <PageHeader title="Editar oveja" />
      <AnimalForm
        action={action}
        initial={{ ...animal, photo: null, photoThumb: null }}
        submitLabel="Guardar cambios"
        cancelHref={back}
        motherOptions={motherOptions}
      />
    </div>
  );
}
