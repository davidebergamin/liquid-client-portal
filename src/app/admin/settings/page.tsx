import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getPortalSettings, PRODUCTION_PORTAL_URL, requireAdmin, updateSettings } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdmin();
  const settings = await getPortalSettings();

  return (
    <main className="liquid-shell min-h-screen bg-background">
      <header className="border-b border-border/80 bg-background/80 px-6 py-7 backdrop-blur-xl md:px-10">
        <div className="mx-auto max-w-3xl">
          <Button asChild variant="ghost" size="sm"><Link href="/admin"><ArrowLeft className="size-4" /> Dashboard</Link></Button>
          <div className="mt-5 h-1.5 w-24 rounded-full liquid-accent-line" />
          <h1 className="mt-4 font-display text-5xl">Impostazioni portale</h1>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-6 py-8 md:px-10">
        <form action={updateSettings} className="liquid-card space-y-4 rounded-xl border border-border p-5">
          <Input name="bank_account_holder" defaultValue={settings?.bank_account_holder ?? ""} placeholder="Intestatario conto" />
          <Input name="iban" defaultValue={settings?.iban ?? ""} placeholder="IBAN" />
          <Input name="booking_url" defaultValue={settings?.booking_url ?? "https://cal.com/davidebergamin/meeting?duration=15"} placeholder="URL prenotazione Cal.com" />
          <div className="space-y-1.5">
            <Input
              name="default_public_base_url"
              defaultValue={settings?.default_public_base_url ?? PRODUCTION_PORTAL_URL}
              placeholder={PRODUCTION_PORTAL_URL}
            />
            <p className="text-xs text-muted-foreground">
              Base URL per i link cliente in produzione. In locale i link usano automaticamente{" "}
              {process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}.
            </p>
          </div>
          <Textarea name="payment_notes" defaultValue={settings?.payment_notes ?? ""} placeholder="Note pagamento / causale bonifico" rows={5} />

          <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
            <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Link Stripe manutenzione</p>
            <Input name="stripe_maintenance_15_url" defaultValue={(settings as any)?.stripe_maintenance_15_url ?? ""} placeholder="Abbonamento 15 €/mese (Payment Link Stripe)" />
            <Input name="stripe_maintenance_30_url" defaultValue={(settings as any)?.stripe_maintenance_30_url ?? ""} placeholder="Abbonamento 30 €/mese" />
            <Input name="stripe_maintenance_50_url" defaultValue={(settings as any)?.stripe_maintenance_50_url ?? ""} placeholder="Abbonamento 50 €/mese" />
            <p className="text-xs text-muted-foreground">Usati nel menu a tendina quando crei un nuovo cliente.</p>
          </div>

          <Button type="submit" className="w-full">Salva impostazioni</Button>
        </form>
      </section>
    </main>
  );
}
