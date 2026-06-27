"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { CopyInlineButton } from "@/components/CopyInlineButton";
import { Button } from "@/components/ui/button";
import { portalCopy } from "../copy";
import type { PortalActions } from "../types";
import { PortalPrimaryButton } from "../shared/PortalPrimaryButton";
import { PortalStepCard } from "../shared/PortalStepCard";
import { toFormData } from "../shared/utils";

export function DeliveryStep({ slug, data, actions }: { slug: string; data: any; actions: PortalActions; isReviewingPast?: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const seen = new Set<string>();
  const payments = data.payments.filter((p: any) => {
    if (seen.has(p.type)) return false;
    seen.add(p.type);
    return true;
  });
  const saldo = payments.find((p: any) => p.type === "saldo");
  const saldoPaid = saldo?.status === "pagato";
  function handlePaymentConfirm(paymentId: string) {
    startTransition(async () => {
      await actions.clientConfirmFinalPayment(toFormData({ slug, payment_id: paymentId }));
      toast.success(portalCopy.toasts.paymentConfirmed);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">{saldoPaid ? portalCopy.delivery.onlinePending : portalCopy.delivery.hint}</p>

      {saldo && (
        <div className={`overflow-hidden rounded-2xl border p-5 ${
          saldoPaid ? "border-emerald-200 bg-emerald-50/50" : "border-border bg-background shadow-sm"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Saldo finale</p>
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
            <PortalPrimaryButton asChild className="mt-4 w-full" size="lg">
              <a href={saldo.payment_url} target="_blank" rel="noreferrer">Paga il saldo →</a>
            </PortalPrimaryButton>
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

      {saldoPaid && (
        <PortalStepCard variant="success" className="p-6">
          <Check className="size-6 text-emerald-700" />
          <p className="mt-3 font-medium text-emerald-800">Perfetto, lo mettiamo online al più presto.</p>
          <p className="mt-1 text-sm text-emerald-700/80">Ti scriviamo appena il sito sarà online.</p>
        </PortalStepCard>
      )}
    </div>
  );
}
