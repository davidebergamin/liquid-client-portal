import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createStyleReference, deleteStyleReference, listStyleReferences, requireAdmin } from "@/lib/portal";

export const dynamic = "force-dynamic";

export default async function AdminStylePage() {
  await requireAdmin();
  const styleReferences = await listStyleReferences();

  return (
    <main className="liquid-shell min-h-screen bg-background">
      <header className="border-b border-border/80 bg-background/80 px-6 py-7 backdrop-blur-xl md:px-10">
        <div className="mx-auto flex max-w-[1300px] flex-wrap items-end justify-between gap-4">
          <div>
            <Button asChild variant="ghost" size="sm"><Link href="/admin"><ArrowLeft className="size-4" /> Dashboard</Link></Button>
            <div className="mt-5 h-1.5 w-24 rounded-full liquid-accent-line" />
            <h1 className="mt-4 font-display text-5xl">Moodboard stile</h1>
          </div>
          <Badge variant="outline">{styleReferences.length} elementi</Badge>
        </div>
      </header>
      <section className="mx-auto grid max-w-[1300px] gap-8 px-6 py-8 md:px-10 lg:grid-cols-[360px_1fr]">
        <form action={createStyleReference} className="liquid-card h-fit space-y-3 rounded-xl border border-border p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-primary">Nuovo riferimento</p>
          <Input name="title" placeholder="Titolo riferimento" />
          <Input name="link_url" placeholder="Link sito opzionale" />
          <Input name="image_url" placeholder="URL immagine opzionale" />
          <Input name="image_file" type="file" accept="image/*" />
          <label className="flex items-center gap-2 text-sm">
            <input name="is_liquid" type="checkbox" />
            Progetto Liquid
          </label>
          <Button type="submit" className="w-full">Aggiungi riferimento</Button>
        </form>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {styleReferences.map((reference: any) => (
            <article key={reference.id} className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all hover:-translate-y-1 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/10">
              <img src={reference.image_url} alt={reference.title ?? ""} className="aspect-[16/10] w-full object-cover object-top" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-2xl">{reference.title || "Riferimento"}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{reference.is_liquid ? "Liquid" : "Esterno"}</p>
                  </div>
                  <form action={deleteStyleReference}>
                    <input type="hidden" name="id" value={reference.id} />
                    <Button type="submit" size="sm" variant="outline">Elimina</Button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
