import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, X } from "lucide-react";
import { addComment, getBoard, toggleLike } from "@/lib/board.functions";
import { SiteCard } from "@/components/SiteCard";
import { Toaster, toast } from "sonner";

export const Route = createFileRoute("/b/$slug")({
  component: LeadBoardPage,
  errorComponent: ({ error }) => (
    <div className="min-h-screen flex items-center justify-center px-6 text-center">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Errore</p>
        <h1 className="font-display text-4xl mt-4">{error.message || "Link non valido"}</h1>
      </div>
    </div>
  ),
  notFoundComponent: () => <div className="p-10">Link non trovato</div>,
});

function LeadBoardPage() {
  const { slug } = Route.useParams();
  const fetchBoard = useServerFn(getBoard);
  const likeFn = useServerFn(toggleLike);
  const commentFn = useServerFn(addComment);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["board", slug],
    queryFn: () => fetchBoard({ data: { slug } }),
  });

  const [zoomed, setZoomed] = useState<string | null>(null);

  const likeMut = useMutation({
    mutationFn: (siteId: string) => likeFn({ data: { slug, siteId } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["board", slug] }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (error) throw error;

  const zoomedSite = data?.sites.find((s) => s.id === zoomed) ?? null;

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="px-6 md:px-10 pt-8 pb-6 flex items-center justify-between">
        <span className="font-mono text-sm tracking-widest font-medium">LIQUID</span>
        {data?.lead && (
          <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            {data.lead.name}
          </span>
        )}
      </header>

      <section className="px-6 md:px-10 pb-12 pt-4 md:pt-10 max-w-[1600px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          [ 01 ] — Mood board
        </p>
        <h1 className="font-display text-5xl md:text-7xl lg:text-[88px] leading-[0.95] mt-3 max-w-5xl">
          {data?.lead ? `Ciao ${data.lead.name}, scegli il tuo stile.` : "Scegli lo stile del tuo nuovo sito."}
        </h1>
        <p className="text-muted-foreground mt-6 max-w-xl text-base md:text-lg leading-relaxed">
          Naviga la selezione, metti like a quelli che ti rappresentano e lascia un commento
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
                liked={s.liked}
                commentsCount={s.comments}
                busy={likeMut.isPending && likeMut.variables === s.id}
                onToggleLike={() => likeMut.mutate(s.id)}
                onSubmitComment={async (body) => {
                  await commentFn({ data: { slug, siteId: s.id, body } });
                  toast.success("Commento aggiunto");
                  qc.invalidateQueries({ queryKey: ["board", slug] });
                }}
                onZoom={() => setZoomed(s.id)}
              />
            ))}
          </div>
        )}
      </main>

      {zoomedSite && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 cursor-zoom-out animate-in fade-in"
          onClick={() => setZoomed(null)}
        >
          <button
            onClick={() => setZoomed(null)}
            className="absolute top-4 right-4 rounded-full bg-card border border-border p-2 hover:bg-accent transition"
            aria-label="Chiudi"
          >
            <X className="size-5" />
          </button>
          <img
            src={zoomedSite.image_url}
            alt={zoomedSite.title ?? "Sito"}
            className="max-w-full max-h-full w-auto h-auto object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
