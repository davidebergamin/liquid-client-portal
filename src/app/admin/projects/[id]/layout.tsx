import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminLiveRefresh } from "@/components/AdminLiveRefresh";
import { ProjectNavTabs } from "@/components/ProjectNavTabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPortalSettings, getProjectById, publicClientPortalUrl, requireAdmin } from "@/lib/portal";

export default async function AdminProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const [project, settings] = await Promise.all([getProjectById(id), getPortalSettings()]);

  if (!project) {
    return (
      <main className="liquid-shell grid min-h-screen place-items-center px-6">
        <div className="text-center">
          <h1 className="font-display text-5xl">Progetto non trovato</h1>
          <Button asChild className="mt-6"><Link href="/admin">Torna ai progetti</Link></Button>
        </div>
      </main>
    );
  }

  return (
    <main className="liquid-shell min-h-screen bg-background">
      <AdminLiveRefresh />
      <header className="border-b border-border/80 bg-background/80 px-6 py-7 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
          <div>
            <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground">
              <ArrowLeft className="size-3.5" /> Tutti i progetti
            </Link>
            <div className="mt-5 h-1.5 w-24 rounded-full liquid-accent-line" />
            <h1 className="mt-3 font-display text-5xl leading-none">{project.name}</h1>
            <p className="mt-1 text-muted-foreground">{project.company_name || "Azienda non inserita"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{project.status || "onboarding"}</Badge>
            <Button asChild variant="outline">
              <a href={publicClientPortalUrl(project.slug, settings?.default_public_base_url)} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Portale cliente
              </a>
            </Button>
          </div>
        </div>
        <ProjectNavTabs projectId={project.id} />
      </header>
      <section className="mx-auto max-w-[1500px] px-6 py-8 md:px-10">{children}</section>
    </main>
  );
}
