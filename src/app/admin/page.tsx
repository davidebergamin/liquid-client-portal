import Link from "next/link";
import { Clock, ExternalLink } from "lucide-react";
import { AdminCreateProjectDialog } from "@/components/AdminCreateProjectDialog";
import { AdminLiveRefresh } from "@/components/AdminLiveRefresh";
import { AdminProjectStatusForm } from "@/components/AdminProjectStatusForm";
import { AdminQueueSheet } from "@/components/AdminQueueSheet";
import { CopyClientLink } from "@/components/CopyClientLink";
import { DeleteProjectButton } from "@/components/DeleteProjectButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createProject, deleteProject, getPortalSettings, listAdminRequestQueue, listProjects, logoutAdmin, maintenancePlanOptions, projectStatuses, resolvePublicBaseUrl, requireAdmin, statusLabels, updateProjectStatus } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  await requireAdmin();
  const [projects, settings, requestQueue] = await Promise.all([
    listProjects(),
    getPortalSettings(),
    listAdminRequestQueue(),
  ]);
  const maintenancePlans = maintenancePlanOptions(settings);
  const statusOptions = projectStatuses.map((status) => ({ value: status, label: statusLabels[status] }));
  const clientPortalBase = await resolvePublicBaseUrl(settings?.default_public_base_url);

  const totals = projects.reduce(
    (acc: { paid: number; owed: number; mrr: number; mrrConfirmed: number }, project: any) => {
      const summary = project.payments_summary;
      if (!summary) return acc;
      acc.paid += summary.paidTotal;
      acc.owed += summary.owedTotal;
      if (summary.mrr) acc.mrr += summary.mrr;
      if (summary.mrrConfirmed) acc.mrrConfirmed += summary.mrr;
      return acc;
    },
    { paid: 0, owed: 0, mrr: 0, mrrConfirmed: 0 },
  );

  return (
    <main className="liquid-shell min-h-screen bg-background">
      <AdminLiveRefresh />
      <header className="border-b border-border/80 bg-background/80 px-6 py-7 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-4 h-1.5 w-24 rounded-full liquid-accent-line" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-primary">Liquid Admin</p>
            <h1 className="mt-1 font-display text-5xl leading-none">Clienti</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminQueueSheet items={requestQueue} />
            <Button asChild variant="outline"><Link href="/admin/manutenzione">Manutenzione</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/style">Moodboard</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/analytics">Analytics</Link></Button>
            <Button asChild variant="outline"><Link href="/admin/settings">Impostazioni</Link></Button>
            <AdminCreateProjectDialog maintenancePlans={maintenancePlans} createAction={createProject} />
            <form action={logoutAdmin}><Button variant="outline">Esci</Button></form>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-6 py-8 md:px-10">
        <div className="liquid-card rounded-xl border border-border p-5">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Progetti</p>
              <h2 className="mt-1 font-display text-4xl">Tutti i clienti</h2>
            </div>
            <Badge variant="outline">{projects.length} totali</Badge>
          </div>

          {projects.length > 0 && (
            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <p className="text-xs text-emerald-700">Incassato (acconti + saldi)</p>
                <p className="mt-1 font-display text-3xl text-emerald-700">{totals.paid.toLocaleString("it-IT")} €</p>
              </div>
              <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
                <p className="text-xs text-amber-700">Da incassare</p>
                <p className="mt-1 font-display text-3xl text-amber-700">{totals.owed.toLocaleString("it-IT")} €</p>
              </div>
              <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4">
                <p className="text-xs text-teal-700">MRR {totals.mrrConfirmed > 0 ? "confermato" : "potenziale"}</p>
                <p className="mt-1 font-display text-3xl text-teal-700">
                  {(totals.mrrConfirmed || totals.mrr).toLocaleString("it-IT")} €
                </p>
              </div>
            </div>
          )}

          {projects.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">Cliente</TableHead>
                    <TableHead className="min-w-[200px]">Stato</TableHead>
                    <TableHead className="min-w-[100px]">Acconto</TableHead>
                    <TableHead className="min-w-[100px]">Saldo</TableHead>
                    <TableHead className="min-w-[100px]">MRR</TableHead>
                    <TableHead>Segnali</TableHead>
                    <TableHead>Follow-up</TableHead>
                    <TableHead className="min-w-[200px]">Prossima azione</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project: any) => {
                    const url = `${clientPortalBase}/p/${project.slug}`;
                    const pay = project.payments_summary;
                    return (
                      <TableRow key={project.id} className="transition-colors hover:bg-accent/65">
                        <TableCell>
                          <p className="font-medium">{project.name}</p>
                          <p className="text-xs text-muted-foreground">{project.company_name || "Azienda mancante"} · {project.email || "email mancante"}</p>
                          <div className="mt-1.5 flex items-center gap-2">
                            <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                              <div className="h-full rounded-full bg-emerald-400" style={{ width: `${project.checklist_percent}%` }} />
                            </div>
                            <span className="font-mono text-[10px] text-muted-foreground">{project.checklist_percent}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <AdminProjectStatusForm
                            projectId={project.id}
                            status={project.status}
                            statusOptions={statusOptions}
                            action={updateProjectStatus}
                          />
                        </TableCell>
                        <TableCell><PaymentCell payment={pay?.acconto} /></TableCell>
                        <TableCell><PaymentCell payment={pay?.saldo} /></TableCell>
                        <TableCell><PaymentCell payment={pay?.manutenzione} recurring /></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline">{project.materials_count} file</Badge>
                            <Badge variant={project.revision_open_count ? "default" : "outline"}>{project.revision_open_count} rev.</Badge>
                            <Badge variant={project.maintenance_open_count ? "default" : "outline"}>{project.maintenance_open_count} manut.</Badge>
                            {project.payment_pending_count > 0 && <Badge>Pagamento da verificare</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <FollowUpBadge days={project.inactive_days} />
                        </TableCell>
                        <TableCell className="max-w-[240px] text-sm text-muted-foreground">{project.next_action}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button asChild size="sm"><Link href={`/admin/projects/${project.id}`}>Apri</Link></Button>
                            <CopyClientLink url={url} />
                            <Button asChild size="sm" variant="outline"><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" /></a></Button>
                            <DeleteProjectButton projectId={project.id} projectName={project.name} action={deleteProject} />
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="liquid-soft-panel rounded-lg border border-dashed border-border py-20 text-center">
              <h2 className="font-display text-4xl">Nessun progetto ancora</h2>
              <p className="mt-2 text-muted-foreground">Crea il primo cliente per generare il suo link personale.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function PaymentCell({
  payment,
  recurring = false,
}: {
  payment?: { amount: number | null; paid: boolean; status: string };
  recurring?: boolean;
}) {
  if (!payment?.amount) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <div className="whitespace-nowrap">
      <p className="text-sm font-medium tabular-nums">
        {payment.amount.toLocaleString("it-IT")} €{recurring ? <span className="text-xs font-normal text-muted-foreground">/m</span> : null}
      </p>
      <Badge
        variant={payment.paid ? "default" : "outline"}
        className={`mt-1 text-[10px] ${payment.paid ? "bg-emerald-600 hover:bg-emerald-600" : "text-amber-700"}`}
      >
        {payment.paid ? "Pagato" : "Da pagare"}
      </Badge>
    </div>
  );
}

function FollowUpBadge({ days }: { days: number | null }) {
  if (days === null) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs text-amber-700">
        <Clock className="size-3" /> Nessuna azione
      </span>
    );
  }
  const urgent = days >= 7;
  const warm = days >= 3;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${
      urgent
        ? "border-red-200 bg-red-50 text-red-700"
        : warm
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-emerald-200 bg-emerald-50 text-emerald-700"
    }`}>
      <Clock className="size-3" />
      {days === 0 ? "Oggi" : `${days}g fa`}
    </span>
  );
}
