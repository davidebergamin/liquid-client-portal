"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { portalCopy } from "../copy";
import type { PortalActions } from "../types";
import { PortalPrimaryButton } from "../shared/PortalPrimaryButton";
import { RequestList } from "../shared/RequestList";

type RevisionNote = { page: string; comment: string };

export function RevisionStep({ slug, data, actions }: { slug: string; data: any; actions: PortalActions; booking: string; isReviewingPast?: boolean }) {
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
      toast.success(portalCopy.toasts.revisionSent);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {data.project.draft_url ? (
          <PortalPrimaryButton asChild size="lg" className="w-full py-6 text-base sm:w-auto sm:py-4 sm:text-sm">
            <a href={data.project.draft_url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-4" /> Apri la bozza del sito
            </a>
          </PortalPrimaryButton>
        ) : (
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">La bozza non è ancora disponibile. Liquid ti avviserà quando è pronta.</p>
          </div>
        )}
      </div>

      {data.project.draft_url && (
        <>
          <div>
            <p className="text-sm font-medium text-primary">Feedback</p>
            <h3 className="mt-1 font-display text-2xl sm:text-3xl">Raccogli tutto il feedback</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Aggiungi tutte le note che vuoi, una per ogni cosa da cambiare. Quando hai finito, invia tutto con un click.
            </p>
          </div>

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
                + Aggiungi un&apos;altra nota
              </button>
            </div>
          </div>

          <PortalPrimaryButton
            type="button"
            size="lg"
            className="w-full py-6 text-base"
            disabled={isPending || sent || (notes.length === 0 && (!current.page.trim() || !current.comment.trim()))}
            onClick={sendAll}
          >
            {isPending ? "Invio in corso…" : sent ? "Feedback inviato ✓" : `Invia feedback a Liquid${notes.length > 0 ? ` (${notes.length + (current.page.trim() && current.comment.trim() ? 1 : 0)} note)` : ""}`}
          </PortalPrimaryButton>
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
