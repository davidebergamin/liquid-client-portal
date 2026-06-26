"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { CopyInlineButton } from "@/components/CopyInlineButton";
import { portalCopy } from "../copy";
import type { PortalActions } from "../types";
import { InvoiceAutosave } from "../shared/InvoiceAutosave";
import { PortalPrimaryButton } from "../shared/PortalPrimaryButton";
import { PortalStepCard } from "../shared/PortalStepCard";
import { Button } from "@/components/ui/button";

export function OnboardingStep({ slug, data, actions, isReviewingPast = false }: { slug: string; data: any; actions: PortalActions; isReviewingPast?: boolean }) {
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
    <div className="space-y-8">
      <PortalStepCard variant="action" className="p-6 sm:p-8">
        <p className="text-sm font-medium text-secondary-foreground">{portalCopy.onboarding.depositLabel}</p>
        {acconto?.amount ? (
          <p className="mt-1 font-display text-5xl sm:text-6xl">
            {Number(acconto.amount).toLocaleString("it-IT")} €
          </p>
        ) : (
          <p className="mt-1 text-xl text-muted-foreground">{portalCopy.onboarding.amountPending}</p>
        )}

        {data.settings?.iban && (
          <div className="mt-6 overflow-hidden rounded-[var(--portal-radius-surface)] portal-surface-inset">
            <div className="p-5">
              <p className="font-mono text-[9px] uppercase tracking-widest text-muted-foreground">{portalCopy.onboarding.bankDetails}</p>
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
            <div className="border-t border-border/60 px-5 py-3">
              <CopyInlineButton value={data.settings.iban} label="Copia IBAN" />
            </div>
          </div>
        )}

        <div className="mt-6">
          {paid ? (
            <PortalStepCard variant="success" className="flex items-center gap-3">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-emerald-100">
                <Check className="size-3.5 text-emerald-700" />
              </span>
              <div>
                <p className="text-sm font-semibold text-emerald-800">{portalCopy.onboarding.paidConfirmed}</p>
                <p className="text-xs text-emerald-700/80">{portalCopy.onboarding.paidConfirmedHint}</p>
              </div>
            </PortalStepCard>
          ) : markedPaid ? (
            <PortalStepCard variant="action" className="bg-muted/30">
              <p className="text-sm font-medium">{portalCopy.onboarding.markedPaid}</p>
              <p className="mt-1 text-sm text-muted-foreground">{portalCopy.onboarding.markedPaidHint}</p>
            </PortalStepCard>
          ) : (
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">{portalCopy.onboarding.markPaidHint}</p>
              {data.capabilities?.clientMarkedPaidAt ? (
                <form action={handleMarkPaid}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="payment_id" value={acconto?.id ?? ""} />
                  <PortalPrimaryButton type="submit" size="lg" disabled={isPending} className="w-full py-7 text-base font-semibold">
                    {isPending ? portalCopy.onboarding.markPaidPending : portalCopy.onboarding.markPaidCta}
                  </PortalPrimaryButton>
                </form>
              ) : (
                <Button type="button" size="lg" variant="outline" className="w-full py-7 text-base font-semibold" onClick={() => setMarkedPaid(true)}>
                  {portalCopy.onboarding.markPaidCta}
                </Button>
              )}
            </div>
          )}
        </div>
      </PortalStepCard>

      {markedPaid && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <PortalStepCard variant="action" className="p-6">
            <p className="text-sm font-medium text-primary">Fatturazione</p>
            <h3 className="mt-1 font-display text-3xl sm:text-4xl">{portalCopy.onboarding.invoiceTitle}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{portalCopy.onboarding.invoiceHint}</p>
            <div className="mt-6">
              <InvoiceAutosave
                slug={slug}
                invoice={data.invoice}
                updateAction={actions.updateInvoice}
                completeAction={actions.completeOnboarding}
                showComplete={!isReviewingPast}
              />
            </div>
          </PortalStepCard>
        </div>
      )}
    </div>
  );
}
