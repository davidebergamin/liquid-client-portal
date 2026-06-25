import { loginAdmin } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="liquid-shell min-h-screen bg-background px-6 py-10 flex items-center justify-center">
      <section className="liquid-card w-full max-w-sm border border-border p-6 rounded-xl">
        <div className="mb-5 h-1.5 w-20 rounded-full liquid-accent-line" />
        <p className="font-mono text-[11px] uppercase tracking-widest text-primary">Liquid admin</p>
        <h1 className="font-display text-4xl mt-3">Accesso privato</h1>
        <form action={loginAdmin} className="mt-8 space-y-3">
          <Input name="email" type="email" placeholder="Email admin Supabase (opzionale)" autoFocus />
          <Input name="password" type="password" placeholder="Password admin" />
          <p className="text-xs text-muted-foreground">
            Usa email e password per Supabase Auth, oppure lascia vuota l'email per usare la password locale.
          </p>
          {error === "missing-auth" && (
            <p className="text-sm text-destructive">Configura Supabase Auth o LIQUID_ADMIN_PASSWORD.</p>
          )}
          {error === "missing-supabase-auth" && (
            <p className="text-sm text-destructive">Configura SUPABASE_URL e SUPABASE_PUBLISHABLE_KEY per Supabase Auth.</p>
          )}
          {error && !["missing-auth", "missing-supabase-auth"].includes(error) && (
            <p className="text-sm text-destructive">Credenziali non valide.</p>
          )}
          <Button type="submit" className="w-full">Entra</Button>
        </form>
      </section>
    </main>
  );
}
