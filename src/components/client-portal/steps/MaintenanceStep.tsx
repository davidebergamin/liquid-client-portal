"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { BookCallButton } from "@/components/BookCallButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { portalCopy } from "../copy";
import type { PortalActions } from "../types";
import { PortalPrimaryButton } from "../shared/PortalPrimaryButton";
import { PortalStepCard } from "../shared/PortalStepCard";
import { RequestList } from "../shared/RequestList";

export function MaintenanceStep({ slug, data, actions, booking }: { slug: string; data: any; actions: PortalActions; booking: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function handleMaintenanceSubmit(formData: FormData) {
    startTransition(async () => {
      try {
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
        <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
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
            <PortalPrimaryButton type="submit" disabled={isPending} className="w-full py-6 text-base font-semibold sm:w-auto sm:py-5">
              {isPending ? "Invio in corso…" : "Invia richiesta a Liquid →"}
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
          <BookCallButton url={booking} variant="outline" className="hidden sm:inline-flex" />
        </div>
        <RequestList items={data.maintenanceRequests} empty="Nessuna richiesta ancora. Quando ti serve qualcosa, scrivici da qui." />
      </div>
    </div>
  );
}
