"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { portalCopy } from "../copy";
import type { PortalActions } from "../types";
import { PortalPrimaryButton } from "../shared/PortalPrimaryButton";
import { PortalStepCard } from "../shared/PortalStepCard";
import { RequestList } from "../shared/RequestList";

export function MaintenanceStep({ slug, data, actions, clientName }: { slug: string; data: any; actions: PortalActions; clientName: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [attachments, setAttachments] = useState<File[]>([]);
  const attachmentsRef = useRef<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function syncFileInput(files: File[]) {
    attachmentsRef.current = files;
    if (!fileInputRef.current) return;
    const transfer = new DataTransfer();
    files.forEach((file) => transfer.items.add(file));
    fileInputRef.current.files = transfer.files;
  }

  function addAttachments(files: FileList | null) {
    if (!files?.length) return;
    setAttachments((current) => {
      const next = [...current, ...Array.from(files)];
      syncFileInput(next);
      return next;
    });
  }

  function removeAttachment(index: number) {
    setAttachments((current) => {
      const next = current.filter((_, itemIndex) => itemIndex !== index);
      syncFileInput(next);
      return next;
    });
  }

  function handleMaintenanceSubmit(formData: FormData) {
    startTransition(async () => {
      try {
        const section = String(formData.get("section") ?? "").trim();
        const details = String(formData.get("details") ?? "").trim();
        const fd = new FormData();
        fd.set("slug", slug);
        fd.set("title", section || "Richiesta aggiornamento sito");
        fd.set("request_type", "aggiornamento");
        fd.set("priority", "media");
        fd.set("description", [
          section ? `Sezione o pagina: ${section}` : null,
          details ? `Descrizione: ${details}` : null,
        ].filter(Boolean).join("\n\n"));
        attachmentsRef.current.forEach((file) => fd.append("attachments", file));
        await actions.createMaintenance(fd);
        setAttachments([]);
        syncFileInput([]);
        toast.success(portalCopy.toasts.maintenanceSent);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : portalCopy.toasts.uploadError);
      }
    });
  }
  return (
    <div className="space-y-10">
      <PortalStepCard variant="action" className="p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Ciao {clientName},</p>
            <h1 className="mt-1 font-display text-4xl leading-tight sm:text-5xl">il tuo sito è online.</h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-muted-foreground">
              Da qui puoi inviarci richieste di aggiornamento quando serve.
            </p>
          </div>
          <span className="w-fit rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-800">
            Stato online
          </span>
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {data.project.published_url && (
            <Button asChild size="lg" className="w-full bg-emerald-600 py-6 text-base text-white hover:bg-emerald-700 sm:w-auto sm:py-4">
              <a href={data.project.published_url} target="_blank" rel="noreferrer">
                <ExternalLink className="size-4" /> Guarda il sito
              </a>
            </Button>
          )}
        </div>
      </PortalStepCard>

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

      <PortalStepCard variant="action" className="rounded-3xl p-5 sm:p-6">
        <p className="text-sm font-medium text-muted-foreground">Nuova richiesta</p>
        <h3 className="mt-1 font-display text-3xl">Dicci cosa aggiornare</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Scrivi dove intervenire e cosa vuoi cambiare. Per gallerie o tanti scatti, carica un file ZIP così le foto restano ordinate.
        </p>
        <form action={handleMaintenanceSubmit} className="mt-6 space-y-5">
          <Input name="section" placeholder="Sezione o pagina dove fare la modifica" required className="h-12 sm:h-10" />
          <Textarea
            name="details"
            placeholder="Descrivi cosa vuoi fare: testo da cambiare, foto da sostituire, nuova informazione da aggiungere, note utili..."
            required
            rows={6}
            className="resize-none text-base sm:text-sm"
          />
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4">
            <p className="text-sm font-medium">Allega file utili</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Puoi caricare nuove foto, immagini, documenti o file ZIP. Per album/gallerie, meglio uno ZIP con le foto già ordinate e nominate.
            </p>
            <input
              ref={fileInputRef}
              id="maintenance-attachments"
              name="attachments"
              type="file"
              multiple
              className="sr-only"
              onChange={(event) => addAttachments(event.target.files)}
            />
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="size-4" /> Scegli file
            </Button>
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((file, index) => (
                  <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 py-2 text-sm">
                    <span className="min-w-0 truncate">{file.name}</span>
                    <Button type="button" variant="ghost" size="icon" className="size-7 shrink-0" onClick={() => removeAttachment(index)} aria-label={`Rimuovi ${file.name}`}>
                      <X className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-muted-foreground">Riceverai aggiornamenti quando la richiesta viene presa in carico.</span>
            <PortalPrimaryButton type="submit" disabled={isPending} className="w-full py-6 text-base font-semibold sm:w-auto sm:py-5">
              {isPending ? "Invio in corso…" : "Invia richiesta a Liquid"}
            </PortalPrimaryButton>
          </div>
        </form>
      </PortalStepCard>

      <div>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Storico</p>
            <h3 className="mt-1 font-display text-2xl">Richieste inviate</h3>
          </div>
        </div>
        <RequestList items={data.maintenanceRequests} empty="Nessuna richiesta ancora. Quando ti serve qualcosa, scrivici da qui." />
      </div>
    </div>
  );
}
