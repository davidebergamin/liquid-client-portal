import { Badge } from "@/components/ui/badge";
import { getPortalProject, getProjectById } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function ProjectStylePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const data = await getPortalProject(projectRow);
  const selected = data.styleReferences.filter((item: any) => item.liked || item.comments.length);

  return (
    <section className="liquid-card rounded-xl border border-border p-5">
      <h2 className="font-display text-4xl">Preferenze stile</h2>
      <p className="mt-2 text-sm text-muted-foreground">Direzione scelta: <span className="text-foreground">{data.project.creative_direction || "non confermata"}</span></p>
      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {selected.length ? selected.map((item: any) => (
          <article key={item.id} className="overflow-hidden rounded-lg border border-border bg-background shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
            <img src={item.image_url} alt={item.title ?? ""} className="h-44 w-full object-cover object-top" />
            <div className="p-3">
              <p className="font-medium">{item.title || "Riferimento"}</p>
              <Badge className="mt-2" variant={item.liked ? "default" : "outline"}>{item.liked ? "Like" : "Commentato"}</Badge>
              {item.comments.map((comment: any) => <p key={comment.id} className="mt-3 border-l-2 border-primary/25 pl-3 text-sm">{comment.body}</p>)}
            </div>
          </article>
        )) : <p className="text-sm text-muted-foreground">Nessuna preferenza stile ancora.</p>}
      </div>
    </section>
  );
}
