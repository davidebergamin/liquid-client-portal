import { ExternalLink, FileText } from "lucide-react";
import { AdminStyleReferenceCard } from "@/components/AdminStyleReferenceCard";
import { Badge } from "@/components/ui/badge";
import { getPortalProject, getProjectById } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function ProjectContentsPage({ params }: { params: Promise<{ id: string }> }) {
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
  ].filter(([, value]) => value);

  const selectedStyles = data.styleReferences.filter((ref: any) => ref.liked || ref.comments.length > 0);

  return (
    <div className="space-y-8">
      <section className="liquid-card rounded-xl border border-border p-5">
        <h2 className="font-display text-4xl">Materiali ({data.materials.length})</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.materials.length ? (
            data.materials.map((material: any) => (
              <a
                key={material.id}
                href={material.signed_url ?? "#"}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 rounded-lg border border-border bg-background p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:bg-accent hover:shadow-md"
              >
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="break-all font-medium">{material.file_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{material.category} · {material.note || "nessuna nota"}</p>
                </div>
              </a>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nessun materiale caricato.</p>
          )}
        </div>
      </section>

      <section className="liquid-card rounded-xl border border-border p-5">
        <h2 className="font-display text-4xl">Brief</h2>
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
            {structuredFields.map(([label, value]) => (
              <div key={label} className="rounded-lg border border-border bg-background p-4 shadow-sm shadow-primary/5">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{value}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="liquid-card rounded-xl border border-border p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-4xl">Preferenze stile</h2>
          {data.project.creative_direction && (
            <Badge variant="outline">Direzione: {data.project.creative_direction}</Badge>
          )}
        </div>
        {data.customInspirations?.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Link inviati dal cliente</p>
            <div className="flex flex-wrap gap-2">
              {data.customInspirations.map((item: any) => (
                <a
                  key={item.id}
                  href={item.body}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-accent"
                >
                  <ExternalLink className="size-3" />
                  {item.body.replace(/^https?:\/\//, "").slice(0, 40)}
                </a>
              ))}
            </div>
          </div>
        )}
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {selectedStyles.length ? (
            selectedStyles.map((item: any) => (
              <AdminStyleReferenceCard
                key={item.id}
                id={item.id}
                title={item.title}
                imageUrl={item.image_url}
                linkUrl={item.link_url}
                liked={item.liked}
                comments={item.comments}
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">Nessuna preferenza stile ancora.</p>
          )}
        </div>
      </section>
    </div>
  );
}
