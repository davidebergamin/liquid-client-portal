"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { FormSelectField } from "@/components/FormSelectField";

type MaintenancePlanOption = {
  value: string;
  label: string;
  stripeUrl?: string | null;
};

export function AdminCreateProjectDialog({
  maintenancePlans,
  createAction,
}: {
  maintenancePlans: MaintenancePlanOption[];
  createAction: (formData: FormData) => Promise<void>;
}) {
  const planOptions = [
    { value: "none", label: "Nessuna manutenzione" },
    ...maintenancePlans.map((plan) => ({
      value: plan.value,
      label: plan.stripeUrl ? `${plan.label} ✓` : `${plan.label} (link Stripe da configurare)`,
    })),
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="size-4" /> Nuovo progetto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display text-3xl">Crea cliente</DialogTitle>
          <DialogDescription>Genera il progetto, imposta preventivo e manutenzione in un passaggio.</DialogDescription>
        </DialogHeader>
        <form action={createAction} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="name" placeholder="Nome cliente *" required />
            <Input name="company_name" placeholder="Azienda" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input name="email" type="email" placeholder="Email" />
            <Input name="phone" placeholder="Telefono" />
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Preventivo</p>
            <Input name="site_total" type="number" min="0" step="0.01" placeholder="Totale sito (€)" />
            <p className="text-xs text-muted-foreground">Acconto e saldo calcolati automaticamente al 50%.</p>
          </div>

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Manutenzione</p>
            <FormSelectField name="maintenance_plan" defaultValue="none" options={planOptions} />
            <Input name="monthly_amount" type="number" min="0" step="0.01" placeholder="Importo custom (€/mese, opzionale)" />
            <Input name="stripe_url" placeholder="Link Stripe custom (se non usi un piano)" />
          </div>

          <Button type="submit" className="w-full">Crea progetto</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
