import { PageHeader } from "@/components/page-header";
import { AnimalForm } from "@/components/forms/animal-form";
import { BackLink } from "@/components/animal/back-link";
import { createRabbitAction } from "@/actions/rabbits";
import { listMotherOptions } from "@/lib/queries/animals-select";

export const metadata = { title: "Nueva coneja" };
export const dynamic = "force-dynamic";

export default async function NuevaConejaPage({
  searchParams,
}: {
  searchParams: Promise<{ madre?: string }>;
}) {
  const [{ madre }, motherOptions] = await Promise.all([
    searchParams,
    listMotherOptions("coneja"),
  ]);
  const defaultMotherId = Number(madre) || undefined;
  return (
    <div>
      <BackLink href="/conejas" label="Conejas" />
      <PageHeader title="Nueva coneja" description="Alta de animal" />
      <AnimalForm
        action={createRabbitAction}
        submitLabel="Crear coneja"
        cancelHref="/conejas"
        tagLabel="Identificador"
        tagPlaceholder="C-001"
        motherOptions={motherOptions}
        defaultMotherId={defaultMotherId}
      />
    </div>
  );
}
