"use client";

import { useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAutosave } from "@/hooks/use-autosave";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { portalCopy } from "../copy";
import type { PortalActions } from "../types";
import { PortalPrimaryButton } from "./PortalPrimaryButton";
import { toFormData } from "./utils";

export function InvoiceAutosave({
  slug,
  invoice,
  updateAction,
  completeAction,
  showComplete = true,
}: {
  slug: string;
  invoice: any;
  updateAction: PortalActions["updateInvoice"];
  completeAction: PortalActions["completeOnboarding"];
  showComplete?: boolean;
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
      {showComplete && (
      <PortalPrimaryButton type="button" size="lg" disabled={isPending} className="w-full py-5 text-base font-semibold sm:w-auto" onClick={handleComplete}>
        {isPending ? portalCopy.onboarding.invoiceCompletePending : portalCopy.onboarding.invoiceComplete}
      </PortalPrimaryButton>
      )}
    </div>
  );
}
