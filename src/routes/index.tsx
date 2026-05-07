import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2 } from "lucide-react";
import { listSites } from "@/lib/board.functions";
import { SiteCard } from "@/components/SiteCard";
import { SiteDialog } from "@/components/SiteDialog";

export const Route = createFileRoute("/")({
  component: BoardPage,
});

function BoardPage() {
  const fetchSites = useServerFn(listSites);
  const { data, isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: () => fetchSites(),
  });
  const [active, setActive] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 md:px-10 pt-8 pb-6 flex items-center justify-between">
        <span className="font-mono text-sm tracking-widest font-medium">LIQUID</span>
        <Link
          to="/admin"
          className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground transition"
        >
          Admin
        </Link>
      </header>

      <section className="px-6 md:px-10 pb-12 pt-4 md:pt-10 max-w-[1600px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          [ 01 ] — Mood board
        </p>
        <h1 className="font-display text-5xl md:text-7xl lg:text-[88px] leading-[0.95] mt-3 max-w-5xl">
          Scegli lo stile del tuo nuovo sito.
        </h1>
        <p className="text-muted-foreground mt-6 max-w-xl text-base md:text-lg leading-relaxed">
          Naviga la selezione, metti like a quelli che ti rappresentano, lascia un commento
          su cosa ti colpisce. Userò le tue scelte per disegnare il tuo brand.
        </p>
      </section>

      <main className="px-6 md:px-10 pb-24 max-w-[1600px] mx-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : !data?.sites.length ? (
          <div className="border border-dashed border-border rounded-xl py-24 text-center">
            <p className="font-display text-3xl">Board vuota</p>
            <p className="text-muted-foreground mt-2 text-sm">
              Carica i primi siti dalla pagina admin.
            </p>
          </div>
        ) : (
          <div className="masonry">
            {data.sites.map((s) => (
              <SiteCard
                key={s.id}
                title={s.title}
                imageUrl={s.image_url}
                width={s.width}
                height={s.height}
                likes={s.likes}
                comments={s.comments}
                onClick={() => setActive(s.id)}
              />
            ))}
          </div>
        )}
      </main>

      <SiteDialog siteId={active} onOpenChange={(o) => !o && setActive(null)} />
    </div>
  );
}
