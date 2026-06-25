import Link from "next/link";
import { ArrowLeft, ExternalLink, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listMaintenanceRequests, requireAdmin, updateMaintenanceStatus } from "@/lib/portal";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  ricevuta: "Ricevuta",
  in_lavorazione: "In lavorazione",
  completata: "Completata",
};

const typeLabels: Record<string, string> = {
  modifica_testo: "Testo",
  cambio_foto: "Foto / galleria",
  nuova_sezione: "Piccola aggiunta",
  problema_tecnico: "Tecnico",
  altro: "Altro",
};

export default async function AdminMaintenancePage() {
  await requireAdmin();
  const requests = await listMaintenanceRequests();
  const open = requests.filter((request: any) => request.status !== "completata");
  const inProgress = requests.filter((request: any) => request.status === "in_lavorazione");
  const completed = requests.filter((request: any) => request.status === "completata");

  return (
    <main className="liquid-shell min-h-screen bg-background">
      <header className="border-b border-border/80 bg-background/80 px-6 py-7 backdrop-blur-xl md:px-10">
        <div className="mx-auto max-w-6xl">
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin"><ArrowLeft className="size-4" /> Dashboard</Link>
          </Button>
          <div className="mt-5 h-1.5 w-24 rounded-full liquid-accent-line" />
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-primary">Liquid Admin</p>
              <h1 className="font-display text-5xl leading-none">Richieste manutenzione</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Tutte le richieste inviate dai clienti dall’area manutenzione: modifiche, foto, gallerie, testi e supporto operativo.
              </p>
            </div>
            <Badge variant="outline">{requests.length} totali</Badge>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl space-y-6 px-6 py-8 md:px-10">
        <div className="grid gap-3 sm:grid-cols-3">
          <StatCard label="Aperte" value={open.length} />
          <StatCard label="In lavorazione" value={inProgress.length} />
          <StatCard label="Completate" value={completed.length} />
        </div>

        {requests.length ? (
          <div className="space-y-4">
            {requests.map((request: any) => (
              <article key={request.id} className="liquid-card rounded-2xl border border-border p-5 shadow-sm">
                <div className="grid gap-5 lg:grid-cols-[1fr_240px]">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <Badge variant={request.status === "completata" ? "default" : "outline"}>
                        {statusLabels[request.status] ?? request.status}
                      </Badge>
                      <Badge variant="outline">{typeLabels[request.request_type] ?? request.request_type}</Badge>
                      <Badge variant={request.priority === "alta" ? "default" : "outline"}>
                        {request.priority === "alta" ? "Urgente" : request.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(request.created_at).toLocaleString("it-IT")}
                      </span>
                    </div>

                    <h2 className="font-display text-3xl leading-tight">{request.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {request.project?.company_name || request.project?.name || "Cliente"} · {request.project?.email || "email non indicata"}
                    </p>

                    <pre className="mt-4 whitespace-pre-wrap rounded-xl border border-border bg-muted/30 p-4 font-sans text-sm leading-relaxed text-foreground">
                      {request.description}
                    </pre>

                    {request.attachments?.length > 0 && (
                      <div className="mt-4">
                        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Allegati</p>
                        <div className="flex flex-wrap gap-2">
                          {request.attachments.map((attachment: any) => (
                            <a
                              key={attachment.id}
                              href={attachment.signed_url ?? "#"}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm transition-colors hover:bg-accent"
                            >
                              <FileText className="size-4 text-primary" />
                              {attachment.file_name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <form action={updateMaintenanceStatus} className="space-y-2 rounded-xl border border-border bg-background p-3">
                      <input type="hidden" name="id" value={request.id} />
                      <input type="hidden" name="project_id" value={request.project_id} />
                      <Select name="status" defaultValue={request.status}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ricevuta">Ricevuta</SelectItem>
                          <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                          <SelectItem value="completata">Completata</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button type="submit" className="w-full">Aggiorna stato</Button>
                    </form>
                    {request.project && (
                      <div className="grid gap-2">
                        <Button asChild variant="outline">
                          <Link href={`/admin/projects/${request.project.id}/manutenzione`}>Apri nel progetto</Link>
                        </Button>
                        <Button asChild variant="outline">
                          <a href={`/p/${request.project.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="size-4" /> Link cliente
                          </a>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border py-20 text-center">
            <h2 className="font-display text-4xl">Nessuna richiesta ancora</h2>
            <p className="mt-2 text-sm text-muted-foreground">Quando un cliente invia una richiesta di manutenzione, apparirà qui.</p>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}
