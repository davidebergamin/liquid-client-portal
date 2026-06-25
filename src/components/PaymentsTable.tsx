"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Payment = {
  id: string;
  type: string;
  title: string;
  amount: number | null;
  status: string;
  payment_url: string | null;
  client_marked_paid_at: string | null;
};

export function PaymentsTable({
  projectId,
  payments,
  action,
}: {
  projectId: string;
  payments: Payment[];
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <div className="liquid-card overflow-hidden rounded-xl border border-border">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-3 font-medium text-muted-foreground">Voce</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Importo</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Cliente dice di aver pagato</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Pagamento confermato</th>
              <th className="px-4 py-3 font-medium text-muted-foreground">Link Stripe</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <PaymentRow key={payment.id} projectId={projectId} payment={payment} action={action} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PaymentRow({
  projectId,
  payment,
  action,
}: {
  projectId: string;
  payment: Payment;
  action: (formData: FormData) => Promise<void>;
}) {
  const [amount, setAmount] = useState(payment.amount != null ? String(payment.amount) : "");
  const [paymentUrl, setPaymentUrl] = useState(payment.payment_url ?? "");
  const [confirmed, setConfirmed] = useState(payment.status === "pagato");
  const [isPending, startTransition] = useTransition();

  function save(next: { amount?: string; paymentUrl?: string; confirmed?: boolean }) {
    const fd = new FormData();
    fd.set("id", payment.id);
    fd.set("project_id", projectId);
    fd.set("amount", next.amount ?? amount);
    fd.set("payment_url", next.paymentUrl ?? paymentUrl);
    fd.set("status", (next.confirmed ?? confirmed) ? "pagato" : "da_pagare");
    startTransition(async () => {
      await action(fd);
    });
  }

  const clientSaid = Boolean(payment.client_marked_paid_at);

  return (
    <tr className="border-b border-border/60 last:border-0">
      <td className="px-4 py-3">
        <span className="font-medium">{payment.title}</span>
        <span className="ml-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{payment.type}</span>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          <Input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onBlur={() => {
              if ((payment.amount != null ? String(payment.amount) : "") !== amount) save({ amount });
            }}
            placeholder="0"
            className="h-9 w-28"
          />
          <span className="text-muted-foreground">€</span>
        </div>
      </td>
      <td className="px-4 py-3">
        {clientSaid ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
            <Check className="size-3" /> Sì
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">In attesa</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          type="button"
          disabled={isPending}
          onClick={() => {
            const next = !confirmed;
            setConfirmed(next);
            save({ confirmed: next });
          }}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
            confirmed
              ? "border-emerald-300 bg-emerald-50 text-emerald-700"
              : "border-border bg-background hover:border-primary/30",
          )}
        >
          <span
            className={cn(
              "grid size-4 shrink-0 place-items-center rounded-full border transition-all",
              isPending
                ? "border-muted-foreground/40 bg-muted"
                : confirmed
                  ? "border-transparent bg-emerald-500 text-white"
                  : "border-border bg-background",
            )}
          >
            {isPending ? <Loader2 className="size-2.5 animate-spin" /> : confirmed ? <Check className="size-2.5" /> : null}
          </span>
          {confirmed ? "Confermato" : "Da confermare"}
        </button>
      </td>
      <td className="px-4 py-3">
        <Input
          value={paymentUrl}
          onChange={(e) => setPaymentUrl(e.target.value)}
          onBlur={() => {
            if ((payment.payment_url ?? "") !== paymentUrl) save({ paymentUrl });
          }}
          placeholder="https://buy.stripe.com/..."
          className="h-9 w-56"
        />
      </td>
    </tr>
  );
}
