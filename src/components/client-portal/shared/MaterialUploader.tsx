"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";
import type { PortalActions } from "../types";
import { PortalPrimaryButton } from "./PortalPrimaryButton";
import { UploadCategory } from "./UploadCategory";
import { toFormData } from "./utils";

export function MaterialUploader({
  slug,
  materials,
  uploadAction,
  completeAction,
  showComplete = true,
}: {
  slug: string;
  materials: any[];
  uploadAction: PortalActions["uploadMaterial"];
  completeAction: PortalActions["completeMaterials"];
  showComplete?: boolean;
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
        <p className="text-sm font-medium text-primary">Upload</p>
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
      {showComplete && (
      <div className="mt-8 rounded-2xl border border-border bg-background p-5 shadow-sm">
        <p className="text-sm font-medium">Hai caricato tutto quello che vuoi inviarci?</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Puoi procedere anche se non hai caricato ogni categoria. Potrai sempre aggiungere altro più avanti se serve.
        </p>
        <PortalPrimaryButton type="button" size="lg" disabled={isPending} className="mt-4 w-full py-7 text-base font-semibold sm:w-auto sm:py-5" onClick={handleComplete}>
          {isPending ? "Sto preparando il prossimo step…" : "Ho caricato tutto, procedi →"}
        </PortalPrimaryButton>
      </div>
      )}
      {materials.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 text-sm font-medium text-muted-foreground">File caricati ({materials.length})</p>
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
