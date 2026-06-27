"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { portalCopy } from "../copy";
import type { PortalActions } from "../types";
import { PortalPrimaryButton } from "../shared/PortalPrimaryButton";
import { PortalStepCard } from "../shared/PortalStepCard";
import { RequestList } from "../shared/RequestList";

export function ApprovalStep({ slug, data, actions }: { slug: string; data: any; actions: PortalActions; isReviewingPast?: boolean }) {
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
      toast.success(portalCopy.toasts.approvalSent);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {data.project.draft_url && (
        <Button asChild size="lg" variant="outline" className="w-full py-5 sm:w-auto">
          <a href={data.project.draft_url} target="_blank" rel="noreferrer">
            <ExternalLink className="size-4" /> Apri la versione finale
          </a>
        </Button>
      )}

      <PortalStepCard variant="action" className="p-5">
        <p className="text-sm font-medium text-muted-foreground">Prima di approvare</p>
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
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={addNote} disabled={!current.page.trim() || !current.comment.trim()}>
              + Aggiungi nota
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={isPending || (notes.length === 0 && (!current.page.trim() || !current.comment.trim()))}
              onClick={sendFeedback}
            >
              {isPending ? "Invio…" : sent ? "Inviato ✓" : "Invia feedback a Liquid"}
            </Button>
          </div>
        </div>
      </PortalStepCard>

      {data.project.approved_at ? (
        <PortalStepCard variant="success" className="flex items-center gap-3 p-5">
          <Check className="size-5 shrink-0 text-emerald-700" />
          <div>
            <p className="font-medium text-emerald-800">Sito approvato</p>
            <p className="text-xs text-emerald-700/80">{new Date(data.project.approved_at).toLocaleString("it-IT")}</p>
          </div>
        </PortalStepCard>
      ) : (
        <PortalStepCard variant="hero" accent="gradient" className="p-6 sm:p-8" showAccentLine>
          <p className="text-base leading-relaxed text-muted-foreground">
            Hai esaminato il sito e sei soddisfatto? Premendo il bottone autorizzi Liquid a procedere con la pubblicazione.
          </p>
          <form action={actions.approveProject} className="mt-6">
            <input type="hidden" name="slug" value={slug} />
            <PortalPrimaryButton type="submit" size="lg" className="w-full py-5 text-base font-semibold sm:w-auto">
              Confermo la versione finale — pubblica →
            </PortalPrimaryButton>
          </form>
        </PortalStepCard>
      )}

      <RequestList items={data.revisionRequests} empty="Nessun feedback inviato ancora." />
    </div>
  );
}
