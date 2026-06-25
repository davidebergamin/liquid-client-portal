import { getPortalProject, getProjectById, updateRevisionStatus } from "@/lib/portal";
import { RevisionToggle } from "@/components/RevisionToggle";

export const dynamic = "force-dynamic";

export default async function ProjectRevisionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const data = await getPortalProject(projectRow);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-4xl">Richieste modifica ({data.revisionRequests.length})</h2>
      <p className="text-sm text-muted-foreground">Spunta la checkbox per segnare una task come completata.</p>
      {data.revisionRequests.length ? data.revisionRequests.map((request: any) => (
        <RevisionToggle
          key={`${request.id}-${request.status}`}
          id={request.id}
          projectId={data.project.id}
          page={request.page}
          section={request.section}
          comment={request.comment}
          priority={request.priority}
          status={request.status}
          action={updateRevisionStatus}
        />
      )) : <p className="text-sm text-muted-foreground">Nessuna richiesta revisione.</p>}
    </section>
  );
}
