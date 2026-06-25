import { FileText } from "lucide-react";
import { getPortalProject, getProjectById } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function ProjectMaterialsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const data = await getPortalProject(projectRow);

  return (
    <section className="liquid-card rounded-xl border border-border p-5">
      <h2 className="font-display text-4xl">Materiali caricati ({data.materials.length})</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {data.materials.length ? data.materials.map((material: any) => (
          <a key={material.id} href={material.signed_url ?? "#"} target="_blank" rel="noreferrer" className="rounded-lg border border-border bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-accent hover:shadow-md">
            <FileText className="size-4 text-primary" />
            <p className="mt-2 break-all font-medium">{material.file_name}</p>
            <p className="mt-1 text-xs text-muted-foreground">{material.category} · {material.note || "nessuna nota"}</p>
          </a>
        )) : <p className="text-sm text-muted-foreground">Nessun materiale caricato.</p>}
      </div>
    </section>
  );
}
