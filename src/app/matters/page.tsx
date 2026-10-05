import { getAllData } from "@/lib/data";
import { SectionHeading } from "@/components/ui";
import { NewMatterButton, MattersList } from "@/components/actions/MatterActions";

export const dynamic = "force-dynamic";

export default async function MattersPage() {
  const data = await getAllData();

  const matterSummaries = data.matters.map((matter) => {
    const docs = data.documents.filter((d) => d.matterId === matter.id);
    const claims = data.claims.filter((c) => c.matterId === matter.id);
    const roles = data.roles.filter((r) => r.matterId === matter.id);
    const events = data.chronology.filter((e) => e.matterId === matter.id);

    return {
      id: matter.id,
      name: matter.name,
      caseNumber: matter.caseNumber,
      court: matter.court,
      status: matter.status,
      description: matter.description,
      docsCount: docs.length,
      claimsCount: claims.length,
      rolesCount: roles.length,
      eventsCount: events.length,
    };
  });

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="CaseVault Core"
        title="Matters & Claims"
        description="Every matter in the vault with its claims, documents, parties, and chronology, all in one place."
        action={<NewMatterButton />}
      />

      <MattersList matters={matterSummaries} />
    </div>
  );
}
