import { getPortalProject, getProjectById } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function ProjectBriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const data = await getPortalProject(projectRow);
  const structuredFields = [
    ["Descrizione attività", data.brief?.business_description],
    ["Servizi principali", data.brief?.main_services],
    ["Obiettivo sito", data.brief?.website_goal],
    ["Pubblico ideale", data.brief?.ideal_audience],
    ["Cosa comunicare", data.brief?.message_to_communicate],
    ["CTA principale", data.brief?.main_cta],
    ["Social", data.brief?.social_links],
    ["Sito attuale", data.brief?.current_website],
  ].filter(([, v]) => v);

  return (
    <div className="space-y-5">
      <section className="liquid-card rounded-xl border border-border p-5">
        <h2 className="font-display text-4xl">Brief iniziale</h2>
        {data.brief?.free_notes ? (
          <div className="mt-5 rounded-xl border border-primary/15 bg-primary/5 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Note libere del cliente</p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{data.brief.free_notes}</p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">Brief non ancora compilato.</p>
        )}
        {structuredFields.length > 0 && (
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {structuredFields.map(([label, value]) => <ReadField key={label} label={label} value={value} />)}
          </div>
        )}
      </section>
    </div>
  );
}

function ReadField({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm shadow-primary/5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 whitespace-pre-wrap text-sm">{value || "Non compilato"}</p>
    </div>
  );
}
