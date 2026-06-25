import Link from "next/link";
import { ArrowLeft, BarChart3, Calendar, FileStack, RefreshCw, Settings2, TrendingUp, Users, Wallet } from "lucide-react";
import { getAdminAnalytics, projectStatuses, statusLabels } from "@/lib/portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  onboarding: "bg-slate-400",
  raccolta_materiali: "bg-blue-400",
  scelta_stile: "bg-violet-400",
  sviluppo_sito: "bg-indigo-500",
  revisione_bozza: "bg-amber-400",
  approvazione_finale: "bg-orange-400",
  pubblicazione: "bg-emerald-400",
  manutenzione_attiva: "bg-teal-500",
};

const priorityConfig = [
  { key: "alta", label: "Alta", color: "bg-red-400", text: "text-red-700", bg: "bg-red-50" },
  { key: "media", label: "Media", color: "bg-amber-400", text: "text-amber-700", bg: "bg-amber-50" },
  { key: "bassa", label: "Bassa", color: "bg-slate-300", text: "text-slate-600", bg: "bg-slate-50" },
];

const completionBucketLabels: Record<string, string> = {
  "0-25": "0–25%",
  "26-50": "26–50%",
  "51-75": "51–75%",
  "76-100": "76–100%",
};
const completionBucketColors: Record<string, string> = {
  "0-25": "bg-red-400",
  "26-50": "bg-amber-400",
  "51-75": "bg-blue-400",
  "76-100": "bg-emerald-400",
};

export default async function AdminAnalyticsPage() {
  const analytics = await getAdminAnalytics();
  const maxStatus = Math.max(...Object.values(analytics.byStatus), 1);
  const totalRevenue = analytics.totals.paidAmount + analytics.totals.pendingAmount;
  const paidPercent = totalRevenue > 0 ? Math.round((analytics.totals.paidAmount / totalRevenue) * 100) : 0;
  const maxBucket = Math.max(...Object.values(analytics.completionBuckets), 1);

  return (
    <main className="liquid-shell min-h-screen bg-background">
      <header className="border-b border-border/80 bg-background/80 px-6 py-7 backdrop-blur-xl md:px-10">
        <div className="mx-auto max-w-[1300px]">
          <Button asChild variant="ghost" size="sm"><Link href="/admin"><ArrowLeft className="size-4" /> Dashboard</Link></Button>
          <div className="mt-5 h-1.5 w-24 rounded-full liquid-accent-line" />
          <p className="mt-4 font-mono text-[11px] uppercase tracking-widest text-primary">Liquid Admin</p>
          <h1 className="mt-1 font-display text-5xl leading-none">Analytics</h1>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1300px] gap-6 px-6 py-8 md:px-10">

        {/* ── KPI row ── */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <Metric label="Progetti attivi" value={analytics.totals.projects} icon={<Users className="size-4" />} />
          <Metric label="Manutenzioni" value={analytics.totals.activeMaintenance} icon={<Settings2 className="size-4" />} accent />
          <Metric label="Completamento medio" value={`${analytics.totals.avgCompletion}%`} icon={<TrendingUp className="size-4" />} />
          <Metric label="Età media progetti" value={`${analytics.totals.avgAgeDays}gg`} icon={<Calendar className="size-4" />} />
          <Metric label="Revisioni aperte" value={analytics.totals.openRevisions} icon={<RefreshCw className="size-4" />} warn={analytics.totals.openRevisions > 0} />
          <Metric label="Manut. aperte" value={analytics.totals.openMaintenance} icon={<BarChart3 className="size-4" />} warn={analytics.totals.openMaintenance > 0} />
          <Metric label="File caricati" value={analytics.totals.materials} icon={<FileStack className="size-4" />} />
          <Metric label="Incassato" value={`${analytics.totals.paidAmount.toLocaleString("it-IT")} €`} icon={<Wallet className="size-4" />} accent />
        </div>

        {/* ── MRR ── */}
        <section className="liquid-card overflow-hidden rounded-xl border border-teal-200 bg-gradient-to-br from-teal-50/60 via-background to-background p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-teal-600">Ricorrente mensile</p>
              <h2 className="mt-1 font-display text-4xl">MRR</h2>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Contratti attivi</p>
              <p className="font-medium">{analytics.totals.activeMaintenance}</p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
              <p className="text-sm text-teal-700">MRR confermato</p>
              <p className="mt-1 font-display text-4xl text-teal-700">{analytics.totals.mrr.toLocaleString("it-IT")} €</p>
              <p className="mt-1 text-xs text-teal-600/70">Manutenzioni con status Pagato</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">MRR potenziale</p>
              <p className="mt-1 font-display text-4xl text-primary">{analytics.totals.mrrPotential.toLocaleString("it-IT")} €</p>
              <p className="mt-1 text-xs text-muted-foreground">Tutti i contratti con importo impostato</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">ARR (annuo stimato)</p>
              <p className="mt-1 font-display text-4xl text-primary">{(analytics.totals.mrrPotential * 12).toLocaleString("it-IT")} €</p>
              <p className="mt-1 text-xs text-muted-foreground">MRR × 12</p>
            </div>
          </div>
        </section>

        {/* ── Cassa ── */}
        <section className="liquid-card rounded-xl border border-border p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Cassa</p>
              <h2 className="mt-1 font-display text-4xl">Entrate previste</h2>
            </div>
            <Badge variant="outline">{paidPercent}% incassato</Badge>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
              <p className="text-sm text-emerald-700">Già entrati</p>
              <p className="mt-1 font-display text-4xl text-emerald-700">{analytics.totals.paidAmount.toLocaleString("it-IT")} €</p>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
              <p className="text-sm text-amber-700">Devono entrare</p>
              <p className="mt-1 font-display text-4xl text-amber-700">{analytics.totals.pendingAmount.toLocaleString("it-IT")} €</p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Pipeline totale</p>
              <p className="mt-1 font-display text-4xl text-primary">{totalRevenue.toLocaleString("it-IT")} €</p>
            </div>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-amber-100">
            <div className="h-full rounded-full bg-emerald-400 transition-all" style={{ width: `${paidPercent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Acconti e saldi: incassati vs da incassare. L&apos;MRR è separato e non entra in questi totali.
          </p>

          <div className="mt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Acconto</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>MRR</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analytics.revenueByClient.map((client: any) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <Link href={`/admin/projects/${client.id}`} className="font-medium hover:text-primary">
                        {client.name}
                      </Link>
                      {client.company_name && <p className="text-xs text-muted-foreground">{client.company_name}</p>}
                    </TableCell>
                    <TableCell><PaymentStatusCell payment={client.acconto} /></TableCell>
                    <TableCell><PaymentStatusCell payment={client.saldo} /></TableCell>
                    <TableCell><PaymentStatusCell payment={client.manutenzione} recurring /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* ── Pipeline + Completamento ── */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <section className="liquid-card rounded-xl border border-border p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Pipeline</p>
                <h2 className="mt-1 font-display text-4xl">Stati progetto</h2>
              </div>
              <Badge variant="outline">{analytics.totals.projects} totali</Badge>
            </div>
            <div className="mt-6 space-y-4">
              {projectStatuses.map((status) => {
                const count = analytics.byStatus[status] ?? 0;
                const clients = analytics.projectsByStatus[status] ?? [];
                const width = `${Math.max((count / maxStatus) * 100, count ? 6 : 0)}%`;
                const barColor = statusColors[status] ?? "bg-primary";
                return (
                  <div key={status}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-foreground/80">{statusLabels[status]}</span>
                      <span className={`font-medium ${count ? "text-foreground" : "text-muted-foreground"}`}>{count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className={`h-2 rounded-full transition-all ${barColor}`} style={{ width }} />
                    </div>
                    {clients.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {clients.map((client: any) => (
                          <Link
                            key={client.id}
                            href={`/admin/projects/${client.id}`}
                            className="rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs hover:bg-accent hover:text-foreground"
                          >
                            {client.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="liquid-card rounded-xl border border-border p-5 space-y-6">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Completamento</p>
              <h2 className="mt-1 font-display text-4xl">Avanzamento clienti</h2>
            </div>
            <div className="flex items-center gap-5">
              <div className="relative grid size-24 shrink-0 place-items-center rounded-full border-4 border-muted overflow-hidden">
                <div
                  className="absolute bottom-0 left-0 right-0 bg-emerald-400 transition-all"
                  style={{ height: `${analytics.totals.avgCompletion}%` }}
                />
                <span className="relative font-display text-2xl">{analytics.totals.avgCompletion}%</span>
              </div>
              <div>
                <p className="text-sm font-medium">Completamento medio</p>
                <p className="mt-1 text-sm text-muted-foreground">su tutti i {analytics.totals.projects} progetti</p>
              </div>
            </div>
            <div className="space-y-2.5">
              {Object.entries(analytics.completionBuckets).map(([bucket, count]) => (
                <div key={bucket}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{completionBucketLabels[bucket]}</span>
                    <span className="font-medium">{count} progetti</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted">
                    <div
                      className={`h-2 rounded-full transition-all ${completionBucketColors[bucket]}`}
                      style={{ width: `${Math.max((count / maxBucket) * 100, count ? 6 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Operatività ── */}
        <section className="liquid-card rounded-xl border border-border p-5">
          <div className="mb-5">
            <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Operatività</p>
            <h2 className="mt-1 font-display text-4xl">Priorità aperte</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <PriorityBlock title="Revisioni" values={analytics.revisionPriority} />
            <PriorityBlock title="Manutenzione" values={analytics.maintenancePriority} />
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Pagamenti non chiusi</p>
              <p className={`mt-1 font-display text-4xl ${analytics.totals.unpaidPayments > 0 ? "text-amber-600" : "text-emerald-600"}`}>
                {analytics.totals.unpaidPayments}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">Età media progetto</p>
              <p className="mt-1 font-display text-4xl text-primary">{analytics.totals.avgAgeDays} giorni</p>
            </div>
          </div>
        </section>

        {/* ── Materiali ── */}
        <section className="liquid-card rounded-xl border border-border p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Materiali</p>
          <h2 className="mt-1 font-display text-4xl">Categorie caricate</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {Object.entries(analytics.materialCategories).length
              ? Object.entries(analytics.materialCategories).map(([category, count]) => (
                  <span key={category} className="rounded-full border border-border bg-muted/50 px-3 py-1 text-sm">
                    {category} <span className="font-medium text-primary">{count}</span>
                  </span>
                ))
              : <p className="text-sm text-muted-foreground">Nessun materiale caricato.</p>}
          </div>
        </section>

      </section>
    </main>
  );
}

function Metric({ label, value, icon, accent, warn }: { label: string; value: string | number; icon?: React.ReactNode; accent?: boolean; warn?: boolean }) {
  return (
    <div className={`liquid-card rounded-xl border p-4 ${accent ? "border-primary/20 bg-primary/5" : warn ? "border-amber-200 bg-amber-50/40" : "border-border"}`}>
      <div className={`mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest ${accent ? "text-primary" : warn ? "text-amber-600" : "text-muted-foreground"}`}>
        {icon}{label}
      </div>
      <p className={`font-display text-3xl ${accent ? "text-primary" : warn ? "text-amber-700" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function PriorityBlock({ title, values }: { title: string; values: Record<string, number> }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="mb-3 text-sm font-medium">{title}</p>
      <div className="flex gap-2">
        {priorityConfig.map(({ key, label, color, text, bg }) => (
          <div key={key} className={`flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-border p-2.5 text-center ${(values[key] ?? 0) > 0 ? bg : ""}`}>
            <div className={`h-1.5 w-6 rounded-full ${color}`} />
            <span className={`font-display text-xl ${(values[key] ?? 0) > 0 ? text : "text-muted-foreground"}`}>{values[key] ?? 0}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentStatusCell({
  payment,
  recurring = false,
}: {
  payment: { amount: number | null; paid: boolean; status: string };
  recurring?: boolean;
}) {
  if (!payment.amount) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }
  return (
    <div className="text-sm">
      <p className="font-medium">{payment.amount.toLocaleString("it-IT")} €{recurring ? "/mese" : ""}</p>
      <Badge variant={payment.paid ? "default" : "outline"} className="mt-1 text-[10px]">
        {payment.paid ? "Pagato" : "Da pagare"}
      </Badge>
    </div>
  );
}
