"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { StyleLikeButton } from "@/components/StyleLikeButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { portalCopy } from "../copy";
import type { PortalActions } from "../types";
import { PortalPrimaryButton } from "../shared/PortalPrimaryButton";
import { PortalStepCard } from "../shared/PortalStepCard";

export function StyleStep({ slug, data, actions, isReviewingPast = false }: { slug: string; data: any; actions: PortalActions; isReviewingPast?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const likedCount = data.styleReferences.filter((ref: any) => ref.liked).length;

  async function handleCustomInspiration(formData: FormData) {
    await actions.addCustomInspiration(formData);
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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PortalStepCard variant="info" className="liquid-step-card-mint border">
        <p className="text-sm font-medium text-primary">{portalCopy.style.howItWorksTitle}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{portalCopy.style.howItWorks}</p>
      </PortalStepCard>
      <form action={handleCustomInspiration} className="portal-surface-elevated rounded-[var(--portal-radius-surface)] p-5 sm:p-6">
        <input type="hidden" name="slug" value={slug} />
        <p className="text-sm font-medium text-muted-foreground">{portalCopy.style.addInspirationHint}</p>
        <h3 className="mt-1 font-display text-2xl">{portalCopy.style.addInspiration}</h3>
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
            <article key={ref.id} className="portal-surface-elevated portal-hover-lift overflow-hidden">
              <img src={ref.image_url} alt={ref.title ?? ""} loading="lazy" decoding="async" className="aspect-[16/10] w-full object-contain bg-muted/30 object-center" />
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
                  <StyleLikeButton slug={slug} siteId={String(ref.id)} liked={ref.liked} toggleAction={actions.toggleStyleLike} />
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
        <p className="text-sm text-muted-foreground">{portalCopy.style.noReferences}</p>
      )}

      {!isReviewingPast && (
      <div className="sticky bottom-3 z-20 mx-auto max-w-xl rounded-3xl border border-[var(--portal-border)] bg-[var(--portal-surface)] p-3 shadow-[var(--portal-shadow)] backdrop-blur-xl sm:bottom-6 sm:rounded-full sm:p-2 sm:pl-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="py-1 sm:py-2">
            <p className="text-xs font-medium text-muted-foreground">{portalCopy.style.confirmTitle}</p>
            <p className="text-sm font-medium">
              {likedCount > 0
                ? `${likedCount} like — pronto quando vuoi`
                : "Puoi continuare anche senza scegliere una card"}
            </p>
          </div>
          <form action={handleConfirmStyle}>
            <input type="hidden" name="slug" value={slug} />
            <PortalPrimaryButton type="submit" size="lg" disabled={isPending} className="w-full gap-2 sm:h-11 sm:w-auto">
              {portalCopy.style.confirmCta}
              <ChevronRight className="size-4" />
            </PortalPrimaryButton>
          </form>
        </div>
      </div>
      )}
    </div>
  );
}
