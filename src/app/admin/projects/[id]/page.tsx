import { CheckCircle2, FileStack, RefreshCw, Wrench } from "lucide-react";
import { getPortalProject, getProjectById, projectStatuses, statusLabels, updateChecklistItem, updateProject } from "@/lib/portal";
import { ChecklistItemToggle } from "@/components/ChecklistItemToggle";
import { FormSelectField } from "@/components/FormSelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <FormSelectField
          name="status"
          defaultValue={project.status}
          options={projectStatuses.map((status) => ({ value: status, label: statusLabels[status] }))}
        />
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
