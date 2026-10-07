import { PageHeader } from "@/components/page-header";
import { AnimalForm } from "@/components/forms/animal-form";
import { BackLink } from "@/components/animal/back-link";
import { createSheepAction } from "@/actions/sheep";
import { listMotherOptions } from "@/lib/queries/animals-select";

export const metadata = { title: "Nueva oveja" };
export const dynamic = "force-dynamic";

export default async function NuevaOvejaPage({
  searchParams,
}: {
  searchParams: Promise<{ madre?: string }>;
}) {
  const [{ madre }, motherOptions] = await Promise.all([
    searchParams,
    listMotherOptions("oveja"),
  ]);
  const defaultMotherId = Number(madre) || undefined;
  return (
    <div>
      <BackLink href="/ovejas" label="Ovejas" />
      <PageHeader title="Nueva oveja" description="Alta de animal" />
      <AnimalForm
        action={createSheepAction}
        submitLabel="Crear oveja"
        cancelHref="/ovejas"
        motherOptions={motherOptions}
        defaultMotherId={defaultMotherId}
      />
    </div>
  );
}
