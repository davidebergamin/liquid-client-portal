import { getPortalProject, getProjectById, updateInvoice, updatePaymentQuick } from "@/lib/portal";
import { PaymentsTable } from "@/components/PaymentsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const dynamic = "force-dynamic";

export default async function ProjectDataPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const data = await getPortalProject(projectRow);

  const seen = new Set<string>();
  const uniquePayments = data.payments.filter((p: any) => {
    if (seen.has(p.type)) return false;
    seen.add(p.type);
    return true;
  });

  return (
    <div className="space-y-8">
      <section className="liquid-card rounded-xl border border-border p-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Cliente</p>
          <h2 className="mt-1 font-display text-4xl">Dati fattura</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Puoi correggere o completare manualmente i dati amministrativi del cliente.
          </p>
        </div>
        <form action={updateInvoice} className="mt-5 grid gap-3 md:grid-cols-2">
          <input type="hidden" name="project_id" value={data.project.id} />
          <Input name="billing_name" defaultValue={data.invoice?.billing_name ?? ""} placeholder="Ragione sociale / nome fatturazione" />
          <Input name="vat_number" defaultValue={data.invoice?.vat_number ?? ""} placeholder="Partita IVA" />
          <Input name="tax_code" defaultValue={data.invoice?.tax_code ?? ""} placeholder="Codice fiscale" />
          <Input name="billing_email" defaultValue={data.invoice?.billing_email ?? ""} placeholder="Email amministrativa" />
          <Input name="billing_address" defaultValue={data.invoice?.billing_address ?? ""} placeholder="Indirizzo" />
          <Input name="postal_code" defaultValue={data.invoice?.postal_code ?? ""} placeholder="CAP" />
          <Input name="city" defaultValue={data.invoice?.city ?? ""} placeholder="Città" />
          <Input name="province" defaultValue={data.invoice?.province ?? ""} placeholder="Provincia" />
          <Input name="country" defaultValue={data.invoice?.country ?? ""} placeholder="Nazione" />
          <Input name="sdi_code" defaultValue={data.invoice?.sdi_code ?? ""} placeholder="Codice SDI" />
          <Input name="pec" defaultValue={data.invoice?.pec ?? ""} placeholder="PEC" />
          <Textarea name="notes" defaultValue={data.invoice?.notes ?? ""} placeholder="Note fatturazione" className="md:col-span-2" rows={4} />
          <Button type="submit" className="md:col-span-2">Salva dati fattura</Button>
        </form>
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-4xl">Pagamenti</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Le modifiche vengono salvate automaticamente. Spunta &ldquo;Pagamento confermato&rdquo; quando ricevi il pagamento.
          </p>
        </div>
        <PaymentsTable projectId={data.project.id} payments={uniquePayments} action={updatePaymentQuick} />
      </section>
    </div>
  );
}
