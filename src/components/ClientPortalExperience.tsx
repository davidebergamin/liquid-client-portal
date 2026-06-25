"use client";

import { Fragment, useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight, ExternalLink, FileText, Heart } from "lucide-react";
import { toast } from "sonner";
import { BookCallButton, bookingUrl } from "@/components/BookCallButton";
import { CopyInlineButton } from "@/components/CopyInlineButton";
import { useAutosave } from "@/hooks/use-autosave";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type PortalActions = {
  updateInvoice: (formData: FormData) => Promise<void>;
  updateBrief: (formData: FormData) => Promise<void>;
  uploadMaterial: (formData: FormData) => Promise<void>;
  toggleStyleLike: (formData: FormData) => Promise<void>;
  addStyleComment: (formData: FormData) => Promise<void>;
  addCustomInspiration: (formData: FormData) => Promise<void>;
  confirmCreativeDirection: (formData: FormData) => Promise<void>;
  confirmStyleSelection: (formData: FormData) => Promise<void>;
  createRevision: (formData: FormData) => Promise<void>;
  submitApprovalFeedback: (formData: FormData) => Promise<void>;
  approveProject: (formData: FormData) => Promise<void>;
  createMaintenance: (formData: FormData) => Promise<void>;
  clientConfirmFinalPayment: (formData: FormData) => Promise<void>;
  clientMarkPaymentPaid: (formData: FormData) => Promise<void>;
  completeMaterials: (formData: FormData) => Promise<void>;
  completeOnboarding: (formData: FormData) => Promise<void>;
};

const statusOrder = [
  "onboarding",
  "scelta_stile",
  "raccolta_materiali",
  "sviluppo_sito",
  "revisione_bozza",
  "approvazione_finale",
  "pubblicazione",
  "manutenzione_attiva",
];


export function ClientPortalExperience({
  slug,
  data,
  actions,
}: {
  slug: string;
  data: any;
  actions: PortalActions;
}) {
  const completed = data.checklist.filter((item: any) => item.completed).length;
  const progress = Math.round((completed / Math.max(data.checklist.length, 1)) * 100);
  const booking = bookingUrl(data.settings);
  const depositPaid = data.payments.some((p: any) => p.type === "acconto" && p.status === "pagato");
  const gatedByDeposit = !depositPaid && data.project.status === "onboarding";
  const activeIndex = Math.max(statusOrder.indexOf(data.project.status), 0);

  const steps = useMemo(
    () => [
      { key: "onboarding", label: "Onboarding", title: "Versa l'acconto e completa i dati", summary: "Chiudiamo la parte amministrativa: appena è ok, il progetto può partire spedito." },
      { key: "scelta_stile", label: "Stile", title: "Scegli le ispirazioni per il tuo sito", summary: "Apri i siti, guarda cosa ti piace e metti like: useremo quei riferimenti come ispirazione per costruire il tuo design." },
      { key: "raccolta_materiali", label: "Materiali", title: "Carica i contenuti del sito", summary: "Più materiale ci dai ora, più velocemente possiamo arrivare a una prima versione solida." },
      { key: "sviluppo_sito", label: "Sviluppo", title: "Liquid sta costruendo il tuo sito", summary: "Stiamo lavorando sulla prima versione. Ti avvisiamo appena è pronta." },
      { key: "revisione_bozza", label: "Revisione", title: "Controlla la bozza e lascia feedback", summary: "Apri il sito, scrivi cosa cambiare o prenota una call." },
      { key: "approvazione_finale", label: "Approvazione", title: "Approva la pubblicazione", summary: "Un'ultima occhiata prima di andare online." },
      { key: "pubblicazione", label: "Online", title: "Il tuo sito è online", summary: "Benvenuto online. Da qui gestisci le prossime evoluzioni." },
      { key: "manutenzione_attiva", label: "Aggiornamenti", title: "Richiedi modifiche e aggiornamenti", summary: "Testo, immagini, nuove sezioni: invia richieste chiare e tracciabili." },
    ],
    [],
  );

  const activeStep = steps[activeIndex];
  const completedSteps = steps.slice(0, activeIndex);
  const isMaintenanceMode = data.project.status === "manutenzione_attiva";

  return (
    <main className="min-h-screen bg-background">
      {/* ── Sticky header ── */}
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-xl md:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono text-[11px] font-semibold uppercase tracking-widest text-primary">LIQUID</span>
            <span className="text-muted-foreground/40">·</span>
            <span className="truncate text-sm font-medium">{data.project.company_name || data.project.name}</span>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {!isMaintenanceMode && (
              <span className="rounded-full border border-border bg-background px-2.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                {progress}%
              </span>
            )}
            <BookCallButton url={booking} variant="outline" className="h-7 px-3 text-[11px]" />
          </div>
        </div>
      </header>

      {/* ── Two-column layout: sidebar left, step content right ── */}
      <div className="mx-auto max-w-6xl px-4 pb-32 pt-10 md:px-6 lg:grid lg:grid-cols-[300px_1fr] lg:items-start lg:gap-16">

        {/* ── Left: client context (sticky on desktop) ── */}
        <aside className="mb-10 space-y-6 lg:sticky lg:top-16 lg:mb-0">
          <div>
            <div className="mb-4 h-0.5 w-12 rounded-full liquid-accent-line" />
            <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Portale cliente</p>
            <h1 className="mt-2 font-display text-4xl leading-none lg:text-5xl">
              {data.project.company_name || data.project.name}
            </h1>
          </div>

          {/* Completed breadcrumb */}
          {!isMaintenanceMode && completedSteps.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {completedSteps.map((step, i) => (
                <Fragment key={step.key}>
                  <span className="inline-flex items-center gap-1 rounded-full bg-secondary/40 px-2.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-secondary-foreground/80">
                    <Check className="size-2" />{step.label}
                  </span>
                  {i < completedSteps.length - 1 && <ChevronRight className="size-2.5 text-muted-foreground/30" />}
                </Fragment>
              ))}
              <ChevronRight className="size-2.5 text-muted-foreground/50" />
              <span className="rounded-full border border-primary/25 bg-primary/5 px-2.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-primary">
                {activeStep?.label}
              </span>
            </div>
          )}

          {/* Action callout */}
          <div className="rounded-xl bg-muted/50 p-4">
            <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{isMaintenanceMode ? "Il tuo sito" : "Adesso"}</p>
            <p className="mt-1.5 text-sm font-medium leading-snug">
              {isMaintenanceMode
                ? "Il progetto è completato. Da qui puoi inviare richieste di aggiornamento quando ne hai bisogno."
                : gatedByDeposit
                ? "Fai il primo passo: acconto e dati fattura. Poi possiamo passare alla parte creativa."
                : data.project.next_action}
            </p>
          </div>

          {!isMaintenanceMode && (
          <div className="rounded-xl border border-border bg-background p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Avanzamento</p>
              <span className="text-xs font-medium text-primary">{completed}/{data.checklist.length}</span>
            </div>
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-emerald-400 transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
            <div className="space-y-1.5">
              {data.checklist.slice(0, 6).map((item: any) => (
                <div key={item.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-all ${item.completed ? "bg-emerald-50 text-emerald-800 animate-in fade-in zoom-in-95" : "text-muted-foreground"}`}>
                  <span className={`grid size-4 shrink-0 place-items-center rounded-full border ${item.completed ? "border-emerald-300 bg-emerald-100" : "border-border"}`}>
                    {item.completed && <Check className="size-2.5" />}
                  </span>
                  <span className={item.completed ? "font-medium" : ""}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </aside>

        {/* ── Right: active step ── */}
        <section>
          <div className="mb-8 border-t border-border pt-8 lg:border-t-0 lg:pt-0">
            <div className="mb-1 flex items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-full bg-primary font-mono text-[11px] font-semibold text-primary-foreground">
                {String(activeIndex + 1).padStart(2, "0")}
              </span>
              <p className="font-mono text-[10px] uppercase tracking-widest text-primary">{activeStep?.label}</p>
            </div>
            <h2 className="mt-3 font-display text-3xl leading-tight sm:text-5xl">{activeStep?.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">{activeStep?.summary}</p>
          </div>

          {activeStep?.key === "onboarding" && <OnboardingStep slug={slug} data={data} actions={actions} />}
          {activeStep?.key === "scelta_stile" && <StyleStep slug={slug} data={data} actions={actions} />}
          {activeStep?.key === "raccolta_materiali" && <MaterialsStep slug={slug} data={data} actions={actions} />}
          {activeStep?.key === "sviluppo_sito" && <WaitingStep booking={booking} />}
          {activeStep?.key === "revisione_bozza" && <RevisionStep slug={slug} data={data} actions={actions} booking={booking} />}
          {activeStep?.key === "approvazione_finale" && <ApprovalStep slug={slug} data={data} actions={actions} />}
          {activeStep?.key === "pubblicazione" && <DeliveryStep slug={slug} data={data} booking={booking} actions={actions} />}
          {activeStep?.key === "manutenzione_attiva" && <MaintenanceStep slug={slug} data={data} actions={actions} booking={booking} />}
        </section>
      </div>
    </main>
  );
}

function UploadCategory({
  slug,
  category,
  title,
  description,
  count,
  action,
}: {
  slug: string;
  category: string;
  title: string;
  description: string;
  count: number;
  action: (formData: FormData) => Promise<void>;
}) {
  const [uploaded, setUploaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          await action(fd);
          setUploaded(true);
          toast.success("File ricevuti. Ottimo, un pezzo in più è pronto.");
          router.refresh();
        });
      }}
      className={`rounded-2xl border p-4 transition-all ${uploaded || count > 0 ? "border-emerald-200 bg-emerald-50/50 shadow-sm shadow-emerald-100" : "border-border bg-background hover:border-primary/20 hover:shadow-sm"}`}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="category" value={category} />
      <div className="grid gap-3 md:grid-cols-[1fr_260px] md:items-center">
        <div className="flex gap-3">
          <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border ${uploaded || count > 0 ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-border text-muted-foreground"}`}>
            <Check className="size-3.5" />
          </span>
          <div>
            <p className="font-medium">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            {(uploaded || count > 0) && <p className="mt-1 text-xs font-medium text-emerald-700">{count || "Nuovo"} file caricato. Avanti così.</p>}
          </div>
        </div>
        <Input name="files" type="file" multiple disabled={isPending} className="h-12 cursor-pointer text-sm sm:h-10" onChange={(event) => event.currentTarget.form?.requestSubmit()} />
      </div>
    </form>
  );
}

// ────── STEP: ONBOARDING ──────

function OnboardingStep({ slug, data, actions }: { slug: string; data: any; actions: PortalActions }) {
  const acconto = useMemo(() => data.payments.find((p: any) => p.type === "acconto") ?? null, [data.payments]);
  const paid = acconto?.status === "pagato";
  const alreadyMarked = !!acconto?.client_marked_paid_at;
  const [markedPaid, setMarkedPaid] = useState(paid || alreadyMarked);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleMarkPaid(formData: FormData) {
    startTransition(async () => {
      await actions.clientMarkPaymentPaid(formData);
      setMarkedPaid(true);
      router.refresh();
    });
  }

  return (
    <div className="space-y-12">
      {/* Acconto */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Acconto</p>
        {acconto?.amount ? (
          <p className="mt-1 font-display text-5xl sm:text-6xl">
            {Number(acconto.amount).toLocaleString("it-IT")} €
          </p>
        ) : (
          <p className="mt-1 text-xl text-muted-foreground">Importo da confermare da Liquid</p>
        )}

        {data.settings?.iban && (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border">
            <div className="bg-muted/30 p-5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">Coordinate bancarie</p>
              {data.settings.bank_account_holder && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Intestatario: <span className="font-semibold text-foreground">{data.settings.bank_account_holder}</span>
                </p>
              )}
              <p className="mt-3 break-all font-mono text-sm font-semibold leading-relaxed tracking-wide sm:text-base">
                {data.settings.iban}
              </p>
              {data.settings.payment_notes && (
                <p className="mt-3 text-sm text-muted-foreground">{data.settings.payment_notes}</p>
              )}
            </div>
            <div className="border-t border-border px-5 py-3">
              <CopyInlineButton value={data.settings.iban} label="Copia IBAN" />
            </div>
          </div>
        )}

        <div className="mt-6">
          {paid ? (
            <div className="flex items-center gap-3 rounded-xl border border-secondary bg-secondary/20 p-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary-foreground/15">
                <Check className="size-3.5 text-secondary-foreground" />
              </span>
              <div>
                <p className="text-sm font-semibold text-secondary-foreground">Acconto confermato da Liquid</p>
                <p className="text-xs text-secondary-foreground/70">Tutto a posto, puoi procedere.</p>
              </div>
            </div>
          ) : markedPaid ? (
            <div className="rounded-xl border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium">Bonifico segnalato ✓</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Liquid lo verificherà a breve. Nel frattempo compila i dati di fatturazione qui sotto.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                Effettua il bonifico con i dati sopra, poi premi il bottone per segnalare il pagamento a Liquid.
              </p>
              {data.capabilities?.clientMarkedPaidAt ? (
                <form action={handleMarkPaid}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="payment_id" value={acconto?.id ?? ""} />
                  <Button type="submit" size="lg" disabled={isPending} className="w-full py-7 text-base font-semibold">
                    {isPending ? "Invio in corso…" : "Ho effettuato il bonifico →"}
                  </Button>
                </form>
              ) : (
                <Button type="button" size="lg" variant="outline" className="w-full py-7 text-base font-semibold" onClick={() => setMarkedPaid(true)}>
                  Ho effettuato il bonifico →
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Invoice — revealed after payment step */}
      {markedPaid && (
        <div className="border-t border-border pt-10">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Fatturazione</p>
          <h3 className="mt-1 font-display text-3xl sm:text-4xl">Completa i tuoi dati</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Necessari per l'emissione della fattura. Vengono salvati automaticamente mentre scrivi.
          </p>
          <div className="mt-6">
            <InvoiceAutosave
              slug={slug}
              invoice={data.invoice}
              updateAction={actions.updateInvoice}
              completeAction={actions.completeOnboarding}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ────── STEP: SCELTA STILE ──────

function StyleStep({ slug, data, actions }: { slug: string; data: any; actions: PortalActions }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const likedCount = data.styleReferences.filter((ref: any) => ref.liked).length;

  async function handleCustomInspiration(formData: FormData) {
    await actions.addCustomInspiration(formData);
    router.refresh();
  }
  async function handleToggleStyleLike(formData: FormData) {
    await actions.toggleStyleLike(formData);
    router.refresh();
  }
  async function handleConfirmStyle(formData: FormData) {
    startTransition(async () => {
      try {
        await actions.confirmStyleSelection(formData);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossibile continuare");
      }
    });
  }
  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-primary/15 bg-primary/5 p-5">
        <p className="text-sm font-medium text-primary">Come funziona</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Prenditi tutto il tempo che ti serve. Apri i siti qui sotto, metti like a quanti riferimenti vuoi e scrivi cosa ti piace:
          useremo colori, ritmo, atmosfera e struttura come ispirazione per progettare il tuo sito Liquid su misura.
          Quando ti senti convinto, premi il bottone in fondo per continuare.
        </p>
      </div>
      <form action={handleCustomInspiration} className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <input type="hidden" name="slug" value={slug} />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Hai altri riferimenti?</p>
        <h3 className="mt-1 font-display text-2xl">Aggiungi un sito di ispirazione</h3>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <Input name="inspiration_url" type="url" placeholder="https://..." required className="h-12 sm:h-10" />
          <Button type="submit" className="h-12 shrink-0 sm:h-10">Aggiungi link</Button>
        </div>
        {data.customInspirations?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {data.customInspirations.map((item: any) => (
              <a key={item.id} href={item.body} target="_blank" rel="noreferrer" className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground">
                {item.body}
              </a>
            ))}
          </div>
        )}
      </form>
      {data.styleReferences.length ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {data.styleReferences.map((ref: any) => (
            <article key={ref.id} className="overflow-hidden rounded-2xl border border-border bg-background shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl">
              <img src={ref.image_url} alt={ref.title ?? ""} className="aspect-[16/10] w-full object-cover object-top" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-2xl">{ref.title || "Riferimento"}</h3>
                    {ref.link_url && (
                      <Button asChild size="sm" className="mt-3 w-full sm:w-auto">
                        <a href={ref.link_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="size-4" /> Visualizza sito
                        </a>
                      </Button>
                    )}
                  </div>
                  <form action={handleToggleStyleLike} className="shrink-0">
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="site_id" value={ref.id} />
                    <Button type="submit" size="sm" variant={ref.liked ? "default" : "outline"} className="gap-1.5">
                      <Heart className={ref.liked ? "size-3.5 fill-current" : "size-3.5"} />
                      {ref.liked ? "Piaciuto" : "Like"}
                    </Button>
                  </form>
                </div>
                <form action={actions.addStyleComment} className="mt-3 flex gap-2">
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="site_id" value={ref.id} />
                  <Input name="body" placeholder="Lascia un commento…" className="text-sm" />
                  <Button type="submit" variant="outline" size="sm" className="shrink-0">Invia</Button>
                </form>
                {ref.comments.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {ref.comments.map((c: any) => (
                      <p key={c.id} className="border-l-2 border-primary/20 pl-3 text-xs text-muted-foreground">{c.body}</p>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">I riferimenti visivi appariranno qui appena Liquid li aggiunge.</p>
      )}

      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Pronto per continuare?</p>
            <h3 className="mt-1 font-display text-2xl">Ho scelto il mio stile</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {likedCount > 0
                ? `${likedCount} riferiment${likedCount === 1 ? "o" : "i"} con like. Puoi aggiungerne altri o andare avanti.`
                : "Metti almeno un like o lascia un commento prima di continuare."}
            </p>
          </div>
          <form action={handleConfirmStyle}>
            <input type="hidden" name="slug" value={slug} />
            <Button type="submit" size="lg" disabled={isPending} className="h-12 w-full gap-2 sm:w-auto">
              Ho scelto il mio stile, continua
              <ChevronRight className="size-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ────── STEP: RACCOLTA MATERIALI ──────

function MaterialsStep({ slug, data, actions }: { slug: string; data: any; actions: PortalActions }) {
  return (
    <div className="space-y-10">
      <BriefAutosave slug={slug} brief={data.brief} action={actions.updateBrief} />
      <div className="border-t border-border pt-10">
        <MaterialUploader
          slug={slug}
          materials={data.materials}
          uploadAction={actions.uploadMaterial}
          completeAction={actions.completeMaterials}
        />
      </div>
    </div>
  );
}

// ────── STEP: SVILUPPO ──────

function WaitingStep({ booking }: { booking: string }) {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-muted/30 p-6 sm:p-8">
        <p className="text-lg font-medium leading-snug sm:text-xl">
          Grazie — adesso aspettiamo. Liquid sta costruendo la prima versione del tuo sito.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Ti avvisiamo quando è pronta. Se vuoi chiarire qualcosa nel frattempo, prenota 15 minuti.
        </p>
      </div>
      <BookCallButton url={booking} className="w-full py-5 text-base sm:w-auto" />
    </div>
  );
}

// ────── STEP: REVISIONE ──────

type RevisionNote = { page: string; comment: string };

function RevisionStep({ slug, data, actions, booking }: { slug: string; data: any; actions: PortalActions; booking: string }) {
  const [notes, setNotes] = useState<RevisionNote[]>([]);
  const [current, setCurrent] = useState<RevisionNote>({ page: "", comment: "" });
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function addNote() {
    if (!current.page.trim() || !current.comment.trim()) return;
    setNotes((prev) => [...prev, current]);
    setCurrent({ page: "", comment: "" });
  }

  function removeNote(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }

  function sendAll() {
    if (notes.length === 0 && (!current.page.trim() || !current.comment.trim())) return;
    const toSend = current.page.trim() && current.comment.trim() ? [...notes, current] : notes;
    startTransition(async () => {
      for (const note of toSend) {
        const fd = new FormData();
        fd.set("slug", slug);
        fd.set("page", note.page);
        fd.set("comment", note.comment);
        fd.set("priority", "media");
        await actions.createRevision(fd);
      }
      setNotes([]);
      setCurrent({ page: "", comment: "" });
      setSent(true);
      toast.success("Feedback inviato a Liquid. Grazie, lo prendiamo in carico subito.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {data.project.draft_url ? (
          <Button asChild size="lg" className="w-full py-6 text-base sm:w-auto sm:py-4 sm:text-sm">
            <a href={data.project.draft_url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> Apri la bozza del sito
            </a>
          </Button>
        ) : (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">La bozza non è ancora disponibile. Liquid ti avviserà quando è pronta.</p>
          </div>
        )}
        <BookCallButton url={booking} className="w-full py-6 sm:w-auto sm:py-4" />
      </div>

      {data.project.draft_url && (
        <>
          <div className="border-t border-border pt-8">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Feedback</p>
            <h3 className="mt-1 font-display text-2xl sm:text-3xl">Raccogli tutto il feedback</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Aggiungi tutte le note che vuoi, una per ogni cosa da cambiare. Quando hai finito, invia tutto con un click.
            </p>
          </div>

          {/* Accumulated notes */}
          {notes.length > 0 && (
            <div className="space-y-2">
              {notes.map((note, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{note.page}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{note.comment}</p>
                  </div>
                  <button type="button" onClick={() => removeNote(i)} className="shrink-0 text-xs text-muted-foreground hover:text-destructive">Rimuovi</button>
                </div>
              ))}
            </div>
          )}

          {/* Input form for a new note */}
          <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
            <p className="mb-3 text-sm font-medium text-muted-foreground">Nuova nota</p>
            <div className="space-y-3">
              <Input
                value={current.page}
                onChange={(e) => setCurrent((p) => ({ ...p, page: e.target.value }))}
                placeholder="Dove? (es. Home → Hero, Pagina Contatti)"
                className="h-12 sm:h-10"
              />
              <Textarea
                value={current.comment}
                onChange={(e) => setCurrent((p) => ({ ...p, comment: e.target.value }))}
                placeholder="Cosa va cambiato, cosa manca, cosa non ti convince…"
                rows={4}
                className="resize-none"
              />
              <button
                type="button"
                onClick={addNote}
                disabled={!current.page.trim() || !current.comment.trim()}
                className="w-full rounded-lg border border-dashed border-border py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:bg-muted/50 hover:text-foreground disabled:opacity-40"
              >
                + Aggiungi un'altra nota
              </button>
            </div>
          </div>

          {/* Send button */}
          <Button
            type="button"
            size="lg"
            className="w-full py-6 text-base"
            disabled={isPending || sent || (notes.length === 0 && (!current.page.trim() || !current.comment.trim()))}
            onClick={sendAll}
          >
            {isPending ? "Invio in corso…" : sent ? "Feedback inviato ✓" : `Invia feedback a Liquid${notes.length > 0 ? ` (${notes.length + (current.page.trim() && current.comment.trim() ? 1 : 0)} note)` : ""}`}
          </Button>
          {sent && (
            <button type="button" className="text-sm text-muted-foreground underline" onClick={() => setSent(false)}>
              Hai altro da aggiungere?
            </button>
          )}
        </>
      )}

      <RequestList items={data.revisionRequests} empty="Nessuna richiesta di modifica ancora." />
    </div>
  );
}

// ────── STEP: APPROVAZIONE ──────

function ApprovalStep({ slug, data, actions }: { slug: string; data: any; actions: PortalActions }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Array<{ page: string; comment: string }>>([]);
  const [current, setCurrent] = useState({ page: "", comment: "" });
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function addNote() {
    if (!current.page.trim() || !current.comment.trim()) return;
    setNotes((prev) => [...prev, { page: current.page.trim(), comment: current.comment.trim() }]);
    setCurrent({ page: "", comment: "" });
  }

  function removeNote(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index));
  }

  function sendFeedback() {
    const pending = current.page.trim() && current.comment.trim()
      ? [...notes, { page: current.page.trim(), comment: current.comment.trim() }]
      : notes;
    if (!pending.length) return;
    startTransition(async () => {
      for (const note of pending) {
        const fd = new FormData();
        fd.set("slug", slug);
        fd.set("page", note.page);
        fd.set("comment", note.comment);
        fd.set("priority", "alta");
        await actions.submitApprovalFeedback(fd);
      }
      setNotes([]);
      setCurrent({ page: "", comment: "" });
      setSent(true);
      toast.success("Feedback inviato. Liquid lo vedrà prima della pubblicazione.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {data.project.draft_url && (
        <Button asChild size="lg" variant="outline" className="w-full py-5 sm:w-auto">
          <a href={data.project.draft_url} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> Apri la versione finale
          </a>
        </Button>
      )}

      <div className="rounded-2xl border border-border bg-background p-5 shadow-sm">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Prima di approvare</p>
        <h3 className="mt-1 font-display text-2xl sm:text-3xl">Hai ancora qualcosa da segnalare?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Puoi inviare note o richieste di modifica anche in questa fase. Quando sei soddisfatto, conferma la versione finale.
        </p>

        {notes.length > 0 && (
          <div className="mt-4 space-y-2">
            {notes.map((note, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <Check className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{note.page}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">{note.comment}</p>
                </div>
                <button type="button" onClick={() => removeNote(i)} className="shrink-0 text-xs text-muted-foreground hover:text-destructive">Rimuovi</button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 space-y-3">
          <Input
            value={current.page}
            onChange={(e) => setCurrent((p) => ({ ...p, page: e.target.value }))}
            placeholder="Dove? (es. Home, Footer, Pagina Contatti)"
            className="h-12 sm:h-10"
          />
          <Textarea
            value={current.comment}
            onChange={(e) => setCurrent((p) => ({ ...p, comment: e.target.value }))}
            placeholder="Cosa vorresti ancora cambiare o verificare…"
            rows={3}
            className="resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={addNote} disabled={!current.page.trim() || !current.comment.trim()}>
              + Aggiungi nota
            </Button>
            <Button
              type="button"
              disabled={isPending || (notes.length === 0 && (!current.page.trim() || !current.comment.trim()))}
              onClick={sendFeedback}
            >
              {isPending ? "Invio…" : sent ? "Inviato ✓" : "Invia feedback a Liquid"}
            </Button>
          </div>
        </div>
      </div>

      {data.project.approved_at ? (
        <div className="flex items-center gap-3 rounded-xl border border-secondary bg-secondary/20 p-5">
          <Check className="size-5 shrink-0 text-secondary-foreground" />
          <div>
            <p className="font-medium text-secondary-foreground">Sito approvato</p>
            <p className="text-xs text-secondary-foreground/70">{new Date(data.project.approved_at).toLocaleString("it-IT")}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border p-6 sm:p-8">
          <p className="text-base leading-relaxed text-muted-foreground">
            Hai esaminato il sito e sei soddisfatto? Premendo il bottone autorizzi Liquid a procedere con la pubblicazione.
          </p>
          <form action={actions.approveProject} className="mt-6">
            <input type="hidden" name="slug" value={slug} />
            <Button type="submit" size="lg" className="w-full py-7 text-base font-semibold sm:w-auto sm:py-5">
              Confermo la versione finale — pubblica →
            </Button>
          </form>
        </div>
      )}

      <RequestList items={data.revisionRequests} empty="Nessun feedback inviato ancora." />
    </div>
  );
}

// ────── STEP: PUBBLICAZIONE / DELIVERY ──────

function DeliveryStep({ slug, data, booking, actions }: { slug: string; data: any; booking: string; actions: PortalActions }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const seen = new Set<string>();
  const payments = data.payments.filter((p: any) => {
    if (seen.has(p.type)) return false;
    seen.add(p.type);
    return true;
  });
  const saldo = payments.find((p: any) => p.type === "saldo");
  const manutenzione = payments.find((p: any) => p.type === "manutenzione");
  const saldoPaid = saldo?.status === "pagato";
  const manutenzioneHasLink = !!manutenzione?.payment_url;
  const allSettled = saldoPaid && manutenzione?.status === "pagato";
  function handlePaymentConfirm(paymentId: string) {
    startTransition(async () => {
      await actions.clientConfirmFinalPayment(toFormData({ slug, payment_id: paymentId }));
      toast.success("Pagamento segnato come completato.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Celebration header */}
      <div className="overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/20">
        <div className="p-6 sm:p-8">
          <div className="mb-4 h-0.5 w-12 rounded-full liquid-accent-line" />
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Ci siamo quasi!</p>
          <h3 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Sei arrivato alla fine del percorso.</h3>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Grazie per il lavoro fatto insieme — la collaborazione è stata ottima.
            Liquid andrà a pubblicare il sito il prima possibile e ti avviserà non appena sarà online.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Nel frattempo, completa i due passaggi qui sotto per sbloccare la pubblicazione.
          </p>
        </div>
      </div>

      {/* Saldo finale */}
      {saldo && (
        <div className={`overflow-hidden rounded-2xl border p-5 ${
          saldoPaid ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-background shadow-sm"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Saldo finale</p>
              <h4 className="mt-0.5 font-display text-3xl">{saldo.title}</h4>
              {saldo.amount && (
                <p className={`mt-1 text-2xl font-medium ${saldoPaid ? "text-emerald-700" : "text-primary"}`}>
                  {Number(saldo.amount).toLocaleString("it-IT")} €
                </p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              saldoPaid ? "bg-emerald-100 text-emerald-700" : "border border-border bg-background text-muted-foreground"
            }`}>
              {saldoPaid ? "✓ Pagato" : "Da pagare"}
            </span>
          </div>
          {!saldoPaid && data.settings?.iban && (
            <div className="mt-4 rounded-xl bg-muted/40 p-4">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">IBAN</p>
              <p className="mt-1 break-all font-mono text-sm font-semibold">{data.settings.iban}</p>
              {data.settings.bank_account_holder && (
                <p className="mt-1 text-xs text-muted-foreground">{data.settings.bank_account_holder}</p>
              )}
              <div className="mt-2"><CopyInlineButton value={data.settings.iban} label="Copia IBAN" /></div>
              {saldo.payment_instructions && (
                <p className="mt-3 text-sm text-muted-foreground">{saldo.payment_instructions}</p>
              )}
            </div>
          )}
          {!saldoPaid && saldo.payment_url && (
            <Button asChild className="mt-4 w-full" size="lg">
              <a href={saldo.payment_url} target="_blank" rel="noreferrer">Paga il saldo →</a>
            </Button>
          )}
          {!saldoPaid && (
            <Button
              type="button"
              variant="outline"
              className="mt-3 w-full"
              disabled={isPending}
              onClick={() => handlePaymentConfirm(saldo.id)}
            >
              Ho pagato il saldo
            </Button>
          )}
        </div>
      )}

      {/* Abbonamento mensile */}
      {manutenzione && (
        <div className={`overflow-hidden rounded-2xl border p-5 ${
          manutenzione.status === "pagato" ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-background shadow-sm"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Abbonamento mensile</p>
              <h4 className="mt-0.5 font-display text-3xl">{manutenzione.title}</h4>
              {manutenzione.amount && (
                <p className="mt-1 text-2xl font-medium text-primary">
                  {Number(manutenzione.amount).toLocaleString("it-IT")} €/mese
                </p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${
              manutenzione.status === "pagato" ? "bg-emerald-100 text-emerald-700" : "border border-border bg-background text-muted-foreground"
            }`}>
              {manutenzione.status === "pagato" ? "✓ Attivo" : "Da attivare"}
            </span>
          </div>
          {manutenzione.status !== "pagato" && (
            <div className="mt-4">
              {manutenzioneHasLink ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Clicca sul link per attivare l&apos;abbonamento su Stripe. È ricorrente: addebita automaticamente ogni mese, puoi disdire quando vuoi.
                  </p>
                  <Button asChild size="lg" className="mt-4 w-full">
                    <a href={manutenzione.payment_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-4" /> Attiva abbonamento su Stripe →
                    </a>
                  </Button>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Liquid ti invierà il link di pagamento a breve.
                </p>
              )}
              {manutenzione.payment_instructions && (
                <p className="mt-3 text-sm text-muted-foreground">{manutenzione.payment_instructions}</p>
              )}
              <Button
                type="button"
                variant="outline"
                className="mt-4 w-full"
                disabled={isPending}
                onClick={() => handlePaymentConfirm(manutenzione.id)}
              >
                Ho attivato/pagato la manutenzione
              </Button>
            </div>
          )}
        </div>
      )}

      {/* After payments settled: go-live message */}
      {allSettled && (
        <div className="rounded-2xl border border-secondary bg-secondary/15 p-6">
          <Check className="size-6 text-secondary-foreground" />
          <p className="mt-3 font-medium">Tutto a posto. Liquid pubblicherà il sito entro breve.</p>
          <p className="mt-1 text-sm text-muted-foreground">Ti avvisiamo quando è online. Ci vediamo dall'altra parte.</p>
        </div>
      )}

      <BookCallButton url={booking} className="w-full py-5 sm:w-auto sm:py-4" />
    </div>
  );
}

// ────── STEP: MANUTENZIONE ──────

function MaintenanceStep({ slug, data, actions, booking }: { slug: string; data: any; actions: PortalActions; booking: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function handleMaintenanceSubmit(formData: FormData) {
    startTransition(async () => {
      const page = String(formData.get("page") ?? "").trim();
      const section = String(formData.get("section") ?? "").trim();
      const details = String(formData.get("details") ?? "").trim();
      const currentUrl = String(formData.get("current_url") ?? "").trim();
      const description = [
        page ? `Pagina: ${page}` : null,
        section ? `Sezione: ${section}` : null,
        currentUrl ? `URL di riferimento: ${currentUrl}` : null,
        details ? `Dettagli: ${details}` : null,
      ].filter(Boolean).join("\n\n");
      const fd = new FormData();
      fd.set("slug", slug);
      fd.set("title", String(formData.get("title") ?? "").trim());
      fd.set("request_type", String(formData.get("request_type") ?? "altro"));
      fd.set("priority", String(formData.get("priority") ?? "media"));
      fd.set("description", description);
      formData.getAll("attachments").forEach((file) => fd.append("attachments", file));
      await actions.createMaintenance(fd);
      toast.success("Richiesta inviata. La prendiamo in carico.");
      router.refresh();
    });
  }
  return (
    <div className="space-y-10">
      <div className="overflow-hidden rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 via-background to-secondary/20">
        <div className="p-6 sm:p-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-primary">Manutenzione attiva</p>
          <h3 className="mt-2 font-display text-4xl leading-tight sm:text-5xl">Qui puoi scriverci per tenere il sito aggiornato.</h3>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Usa questa area per piccoli aggiornamenti, sostituzioni di testi o immagini, caricamento di nuove gallerie, correzioni o richieste operative sul sito.
            Se la cosa è più facile da spiegare a voce, prenota una call veloce.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <BookCallButton url={booking} className="w-full py-6 text-base sm:w-auto sm:py-4" />
            {data.project.published_url && (
              <Button asChild variant="outline" size="lg" className="w-full py-6 text-base sm:w-auto sm:py-4">
                <a href={data.project.published_url} target="_blank" rel="noreferrer">
                  <ExternalLink className="size-4" /> Apri il sito
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Testi e contenuti", "Correggere una frase, aggiornare un servizio, aggiungere una piccola informazione."],
          ["Foto e gallerie", "Inviare nuove immagini, sostituire una foto, caricare un album o una galleria."],
          ["Supporto rapido", "Segnalare qualcosa che non torna o chiedere un chiarimento operativo."],
        ].map(([title, description]) => (
          <div key={title} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <p className="text-sm font-medium">{title}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-background p-5 shadow-sm sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Nuova richiesta</p>
        <h3 className="mt-1 font-display text-3xl">Dicci cosa aggiornare</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Più sei preciso su pagina, sezione e contenuto, più riusciamo a intervenire velocemente. Per gallerie o tanti scatti, carica un file ZIP così le foto restano ordinate.
        </p>
        <form action={handleMaintenanceSubmit} className="mt-6 space-y-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="title" placeholder="Titolo breve (es. Aggiornare foto Home)" required className="h-12 sm:h-10" />
            <Select name="request_type" defaultValue="cambio_foto">
              <SelectTrigger className="h-12 sm:h-10"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="modifica_testo">Modifica testo</SelectItem>
                <SelectItem value="cambio_foto">Foto o galleria</SelectItem>
                <SelectItem value="nuova_sezione">Piccola aggiunta / sezione</SelectItem>
                <SelectItem value="problema_tecnico">Problema tecnico</SelectItem>
                <SelectItem value="altro">Altro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="page" placeholder="Pagina (es. Home, Servizi, Gallery)" className="h-12 sm:h-10" />
            <Input name="section" placeholder="Sezione precisa (es. Hero, Footer, Galleria estate)" className="h-12 sm:h-10" />
          </div>
          <Input name="current_url" type="url" placeholder="Link della pagina, se vuoi (opzionale)" className="h-12 sm:h-10" />
          <Textarea
            name="details"
            placeholder="Scrivi qui cosa serve: quale testo cambiare, dove vanno le nuove foto, che ordine devono avere, cosa sostituire, note utili..."
            required
            rows={6}
            className="resize-none text-base sm:text-sm"
          />
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Allega file utili</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Puoi caricare nuove foto, immagini, documenti o file ZIP. Per album/gallerie, meglio uno ZIP con le foto già ordinate e nominate.
            </p>
            <Input name="attachments" type="file" multiple className="mt-3 h-12 text-sm sm:h-10" />
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Select name="priority" defaultValue="media">
              <SelectTrigger className="h-12 sm:h-10 sm:max-w-[220px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bassa">Non urgente</SelectItem>
                <SelectItem value="media">Normale</SelectItem>
                <SelectItem value="alta">Abbastanza urgente</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={isPending} className="w-full py-6 text-base font-semibold sm:w-auto sm:py-5">
              {isPending ? "Invio in corso…" : "Invia richiesta a Liquid →"}
            </Button>
          </div>
        </form>
      </div>

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Storico</p>
            <h3 className="mt-1 font-display text-2xl">Richieste inviate</h3>
          </div>
          <BookCallButton url={booking} variant="outline" className="hidden sm:inline-flex" />
        </div>
        <RequestList items={data.maintenanceRequests} empty="Nessuna richiesta ancora. Quando ti serve qualcosa, scrivici da qui." />
      </div>
    </div>
  );
}

// ────── SHARED: INVOICE AUTOSAVE ──────

function InvoiceAutosave({
  slug,
  invoice,
  updateAction,
  completeAction,
}: {
  slug: string;
  invoice: any;
  updateAction: (formData: FormData) => Promise<void>;
  completeAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const save = useCallback(async (values: Record<string, string>) => { await updateAction(toFormData({ slug, ...values })); }, [updateAction, slug]);
  const form = useAutosave<Record<string, string>>({
    initialValues: {
      billing_name: invoice?.billing_name ?? "",
      vat_number: invoice?.vat_number ?? "",
      tax_code: invoice?.tax_code ?? "",
      billing_email: invoice?.billing_email ?? "",
      billing_address: invoice?.billing_address ?? "",
      notes: invoice?.notes ?? "",
    },
    onSave: save,
  });
  function handleComplete() {
    startTransition(async () => {
      await updateAction(toFormData({ slug, ...form.values }));
      await completeAction(toFormData({ slug }));
      router.refresh();
    });
  }
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2">
      {([
        ["billing_name", "Nome o ragione sociale"],
        ["vat_number", "Partita IVA"],
        ["tax_code", "Codice fiscale"],
        ["billing_email", "Email fatturazione"],
        ["billing_address", "Indirizzo fatturazione"],
      ] as [string, string][]).map(([name, placeholder]) => (
        <Input key={name} value={form.values[name]} placeholder={placeholder} className="h-12 text-base sm:h-9 sm:text-sm" onChange={(e) => form.setField(name, e.target.value)} />
      ))}
      <Textarea className="resize-none sm:col-span-2" value={form.values.notes} placeholder="Note fatturazione" rows={3} onChange={(e) => form.setField("notes", e.target.value)} />
      </div>
      <Button type="button" size="lg" disabled={isPending} className="w-full py-7 text-base font-semibold sm:w-auto sm:py-5" onClick={handleComplete}>
        {isPending ? "Sto preparando il prossimo step…" : "Procedi alla scelta dello stile →"}
      </Button>
    </div>
  );
}

// ────── SHARED: BRIEF AUTOSAVE — single free-text field ──────

function BriefAutosave({ slug, brief, action }: { slug: string; brief: any; action: (formData: FormData) => Promise<void> }) {
  const save = useCallback(async (values: Record<string, string>) => { await action(toFormData({ slug, ...values })); }, [action, slug]);
  const form = useAutosave<Record<string, string>>({
    initialValues: {
      free_notes: brief?.free_notes || brief?.business_description || "",
    },
    onSave: save,
  });
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Brief</p>
      <h3 className="mt-0.5 font-display text-2xl sm:text-3xl">Raccontaci il progetto</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Scrivi liberamente: chi sei, cosa fai, a chi ti rivolgi e qualsiasi cosa possa aiutarci a costruire il sito perfetto.
      </p>
      <Textarea
        className="mt-4 min-h-[180px] resize-none text-base sm:text-sm"
        value={form.values.free_notes}
        placeholder="Es: sono un fotografo specializzato in matrimoni nel nord Italia, il mio target sono coppie tra 25 e 40 anni, voglio trasmettere eleganza e professionalità..."
        rows={8}
        onChange={(e) => form.setField("free_notes", e.target.value)}
      />
    </div>
  );
}

// ────── SHARED: MATERIAL UPLOADER ──────

function MaterialUploader({
  slug,
  materials,
  uploadAction,
  completeAction,
}: {
  slug: string;
  materials: any[];
  uploadAction: (formData: FormData) => Promise<void>;
  completeAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const uploadSections = [
    { category: "logo", title: "Carica logo", description: "Logo, icone, brand kit o varianti colore." },
    { category: "foto", title: "Carica foto e materiali visivi", description: "Immagini, scatti professionali, grafiche o contenuti visual. Se hai album di foto, meglio caricarli in un file ZIP così restano ordinati." },
    { category: "documenti", title: "Carica documenti", description: "Testi, brochure, listini, presentazioni o file utili." },
  ];
  function handleComplete() {
    startTransition(async () => {
      await completeAction(toFormData({ slug }));
      router.refresh();
    });
  }
  return (
    <div>
      <div className="mb-5">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Upload</p>
        <h3 className="mt-0.5 font-display text-2xl sm:text-3xl">Carica i file</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Abbiamo diviso tutto in piccoli blocchi: carica quello che hai pronto, anche in più momenti. Quando pensi di aver finito, premi il bottone in fondo per procedere.
        </p>
        <p className="mt-2 rounded-xl border border-primary/15 bg-primary/5 p-3 text-sm text-muted-foreground">
          Se devi inviare album o tante foto insieme, crea un file <span className="font-medium text-foreground">.zip</span> e caricalo nella sezione foto: così restano ordinate e facili da gestire.
        </p>
      </div>
      <div className="grid gap-3">
        {uploadSections.map((section) => (
          <UploadCategory
            key={section.category}
            slug={slug}
            action={uploadAction}
            category={section.category}
            title={section.title}
            description={section.description}
            count={materials.filter((m) => m.category === section.category).length}
          />
        ))}
      </div>
      <div className="mt-8 rounded-2xl border border-border bg-background p-5 shadow-sm">
        <p className="text-sm font-medium">Hai caricato tutto quello che vuoi inviarci?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Puoi procedere anche se non hai caricato ogni categoria. Potrai sempre aggiungere altro più avanti se serve.
        </p>
        <Button type="button" size="lg" disabled={isPending} className="mt-4 w-full py-7 text-base font-semibold sm:w-auto sm:py-5" onClick={handleComplete}>
          {isPending ? "Sto preparando il prossimo step…" : "Ho caricato tutto, procedi →"}
        </Button>
      </div>
      {materials.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">File caricati ({materials.length})</p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {materials.map((m) => (
              <a key={m.id} href={m.signed_url ?? "#"} target="_blank" rel="noreferrer" className="flex items-start gap-3 rounded-xl border border-border p-3 transition-all hover:border-primary/25 hover:bg-accent">
                <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <p className="break-all text-sm font-medium leading-snug">{m.file_name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{m.category}{m.note ? ` · ${m.note}` : ""}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ────── SHARED: REQUEST LIST ──────

function RequestList({ items, empty }: { items: any[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-3">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Richieste inviate</p>
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.title || item.page}</p>
            <Badge variant={item.status === "completata" ? "default" : "outline"} className="text-[10px]">{item.status}</Badge>
            <Badge variant="outline" className="text-[10px]">{item.priority}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{item.description || item.comment}</p>
          {item.attachments?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.attachments.map((att: any) => (
                <a key={att.id} href={att.signed_url ?? "#"} target="_blank" rel="noreferrer" className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">{att.file_name}</a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ────── UTIL ──────

function toFormData(values: Record<string, string>) {
  const fd = new FormData();
  Object.entries(values).forEach(([k, v]) => fd.set(k, v));
  return fd;
}
