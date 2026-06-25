import { CheckCircle2, ExternalLink, FileText, FileStack, Heart, RefreshCw, Wrench } from "lucide-react";
import { getPortalProject, getProjectById, projectStatuses, statusLabels, updateChecklistItem, updateProject } from "@/lib/portal";
import { ChecklistItemToggle } from "@/components/ChecklistItemToggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function AdminProjectOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const data = await getPortalProject(projectRow);
  const { project } = data;

  return (
    <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
      <form action={updateProject} className="liquid-card space-y-4 rounded-xl border border-border p-5">
        <input type="hidden" name="id" value={project.id} />
        <SectionTitle eyebrow="Controllo" title="Progetto" />
        <Input name="name" defaultValue={project.name} placeholder="Nome cliente" required />
        <Input name="company_name" defaultValue={project.company_name ?? ""} placeholder="Azienda" />
        <Input name="email" defaultValue={project.email ?? ""} placeholder="Email" />
        <Input name="phone" defaultValue={project.phone ?? ""} placeholder="Telefono" />
        <Select name="status" defaultValue={project.status}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {projectStatuses.map((status) => <SelectItem key={status} value={status}>{statusLabels[status]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Textarea name="next_action" defaultValue={project.next_action ?? ""} placeholder="Prossima azione richiesta" rows={3} />
        <Input name="draft_url" defaultValue={project.draft_url ?? ""} placeholder="Link bozza sito" />
        <Input name="published_url" defaultValue={project.published_url ?? ""} placeholder="Link sito pubblicato" />
        <label className="flex items-center gap-2 text-sm">
          <input name="maintenance_active" type="checkbox" defaultChecked={project.maintenance_active} />
          Manutenzione attiva
        </label>
        <Textarea name="internal_notes" defaultValue={project.internal_notes ?? ""} placeholder="Note interne" rows={4} />
        <Button type="submit" className="w-full">Salva progetto</Button>
      </form>

      <section className="space-y-6">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Materiali" value={data.materials.length} icon={<FileStack className="size-4" />} />
          <Metric label="Revisioni" value={data.revisionRequests.filter((item: any) => item.status !== "completata").length} icon={<RefreshCw className="size-4" />} warn={data.revisionRequests.filter((item: any) => item.status !== "completata").length > 0} />
          <Metric label="Manutenzione" value={data.maintenanceRequests.filter((item: any) => item.status !== "completata").length} icon={<Wrench className="size-4" />} warn={data.maintenanceRequests.filter((item: any) => item.status !== "completata").length > 0} />
          <Metric label="Pagamento" value={data.payments.some((item: any) => item.client_marked_paid_at && item.status !== "pagato") ? "Da verificare" : "OK"} icon={<CheckCircle2 className="size-4" />} warn={data.payments.some((item: any) => item.client_marked_paid_at && item.status !== "pagato")} />
        </div>
        <div className="liquid-card rounded-xl border border-border p-5">
          <div className="mb-5 flex items-end justify-between gap-3">
            <SectionTitle eyebrow="Checklist" title="Percorso" />
            <p className="text-xs text-muted-foreground">Spunta manualmente per aggiornare la view del cliente</p>
          </div>
          <div className="grid gap-2 md:grid-cols-2">
            {data.checklist.map((item: any) => (
              <ChecklistItemToggle
                key={`${item.id}-${item.completed}`}
                id={item.id}
                projectId={data.project.id}
                label={item.label}
                completed={item.completed}
                action={updateChecklistItem}
              />
            ))}
          </div>
        </div>
        <div className="liquid-card rounded-xl border border-border p-5">
          <SectionTitle eyebrow="Azioni cliente" title="Segnali recenti" />
          <div className="mt-5 space-y-3">
            {data.payments.filter((item: any) => item.client_marked_paid_at && item.status !== "pagato").map((payment: any) => (
              <div key={payment.id} className="rounded-lg border border-border bg-background p-3 shadow-sm shadow-primary/5">
                <Badge>Pagamento da verificare</Badge>
                <p className="mt-2 text-sm">{payment.title} · {payment.amount ? `${Number(payment.amount).toLocaleString("it-IT")} €` : "importo non impostato"}</p>
              </div>
            ))}
            {!data.payments.some((item: any) => item.client_marked_paid_at && item.status !== "pagato") && <p className="text-sm text-muted-foreground">Nessun segnale aperto.</p>}
          </div>
        </div>

        {/* ── Brief ── */}
        <div className="liquid-card rounded-xl border border-border p-5">
          <SectionTitle eyebrow="Brief" title="Cosa ci ha detto" />
          <div className="mt-4">
            {data.brief?.free_notes ? (
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Note libere</p>
                <p className="mt-2 whitespace-pre-wrap text-sm">{data.brief.free_notes}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Brief non ancora compilato dal cliente.</p>
            )}
            {(data.brief?.business_description || data.brief?.main_services || data.brief?.website_goal) && (
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {[
                  ["Attività", data.brief?.business_description],
                  ["Servizi", data.brief?.main_services],
                  ["Obiettivo sito", data.brief?.website_goal],
                  ["Pubblico", data.brief?.ideal_audience],
                  ["CTA", data.brief?.main_cta],
                  ["Social", data.brief?.social_links],
                  ["Sito attuale", data.brief?.current_website],
                ].filter(([, v]) => v).map(([label, value]) => (
                  <div key={label} className="rounded-lg border border-border bg-background p-3">
                    <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{label}</p>
                    <p className="mt-1 text-sm">{value}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Stile ── */}
        <div className="liquid-card rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle eyebrow="Stile" title="Preferenze visive" />
            {data.project.creative_direction && (
              <Badge variant="outline">Direzione: {data.project.creative_direction}</Badge>
            )}
          </div>
          {data.customInspirations?.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Link inviati dal cliente</p>
              <div className="flex flex-wrap gap-2">
                {data.customInspirations.map((item: any) => (
                  <a key={item.id} href={item.body} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs hover:bg-accent">
                    <ExternalLink className="size-3" />{item.body.replace(/^https?:\/\//, "").slice(0, 40)}
                  </a>
                ))}
              </div>
            </div>
          )}
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.styleReferences.filter((r: any) => r.liked || r.comments.length > 0).length ? (
              data.styleReferences.filter((r: any) => r.liked || r.comments.length > 0).map((ref: any) => (
                <div key={ref.id} className="overflow-hidden rounded-lg border border-border">
                  {ref.image_url && <img src={ref.image_url} alt={ref.title ?? ""} className="h-28 w-full object-cover object-top" />}
                  <div className="p-3">
                    <div className="flex items-center gap-2">
                      <p className="flex-1 truncate text-sm font-medium">{ref.title || "Riferimento"}</p>
                      {ref.liked && <Heart className="size-3.5 shrink-0 fill-current text-primary" />}
                    </div>
                    {ref.comments.map((c: any) => (
                      <p key={c.id} className="mt-2 border-l-2 border-primary/25 pl-2 text-xs text-muted-foreground">{c.body}</p>
                    ))}
                  </div>
                </div>
              ))
            ) : <p className="text-sm text-muted-foreground col-span-full">Nessuna preferenza stile ancora.</p>}
          </div>
        </div>

        {/* ── Materiali ── */}
        <div className="liquid-card rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <SectionTitle eyebrow="Materiali" title={`File caricati (${data.materials.length})`} />
          </div>
          {data.materials.length ? (
            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {data.materials.map((m: any) => (
                <a key={m.id} href={m.signed_url ?? "#"} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-lg border border-border bg-background p-3 transition-all hover:border-primary/20 hover:bg-accent">
                  <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="break-all text-sm font-medium leading-snug">{m.file_name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{m.category}{m.note ? ` · ${m.note}` : ""}</p>
                  </div>
                </a>
              ))}
            </div>
          ) : <p className="mt-4 text-sm text-muted-foreground">Nessun materiale caricato.</p>}
        </div>
      </section>
    </div>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-1 font-display text-3xl">{title}</h2>
    </div>
  );
}

function Metric({ label, value, icon, warn }: { label: string; value: string | number; icon?: React.ReactNode; warn?: boolean }) {
  return (
    <div className={`liquid-card rounded-xl border p-4 ${warn ? "border-amber-200 bg-amber-50/40" : "border-border"}`}>
      <div className={`mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${warn ? "text-amber-600" : "text-muted-foreground"}`}>
        {icon}{label}
      </div>
      <p className={`font-display text-3xl ${warn ? "text-amber-700" : "text-primary"}`}>{value}</p>
    </div>
  );
}
