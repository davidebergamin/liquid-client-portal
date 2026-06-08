import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, X, Upload, Link as LinkIcon, Trash2, ExternalLink, MessageCircle, Send } from "lucide-react";
import {
  addComment,
  addLeadSite,
  addLeadSiteComment,
  deleteLeadSite,
  getBoard,
  getLeadUploads,
  toggleLike,
} from "@/lib/board.functions";
import { SiteCard } from "@/components/SiteCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const fetchUploads = useServerFn(getLeadUploads);
  const likeFn = useServerFn(toggleLike);
  const commentFn = useServerFn(addComment);
  const addLeadSiteFn = useServerFn(addLeadSite);
  const delLeadSiteFn = useServerFn(deleteLeadSite);
  const addLeadCommentFn = useServerFn(addLeadSiteComment);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["board", slug],
    queryFn: () => fetchBoard({ data: { slug } }),
    refetchInterval: (q) => {
      const d = q.state.data as { sites?: { screenshot_status?: string }[] } | undefined;
      return d?.sites?.some((s) => s.screenshot_status === "pending") ? 4000 : false;
    },
  });

  const { data: uploads } = useQuery({
    queryKey: ["lead-uploads", slug],
    queryFn: () => fetchUploads({ data: { slug } }),
    refetchInterval: (q) => {
      const d = q.state.data as { leadSites?: { screenshot_status?: string }[] } | undefined;
      return d?.leadSites?.some((s) => s.screenshot_status === "pending") ? 4000 : false;
    },
  });

  const [detailId, setDetailId] = useState<string | null>(null);

  const likeMut = useMutation({
    mutationFn: (siteId: string) => likeFn({ data: { slug, siteId } }),
    onMutate: async (siteId: string) => {
      await qc.cancelQueries({ queryKey: ["board", slug] });
      const prev = qc.getQueryData<any>(["board", slug]);
      qc.setQueryData<any>(["board", slug], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          sites: old.sites.map((s: any) =>
            s.id === siteId ? { ...s, liked: !s.liked } : s
          ),
        };
      });
      return { prev };
    },
    onError: (e: Error, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["board", slug], ctx.prev);
      toast.error(e.message);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["board", slug] }),
  });

  const invalidateUploads = () => qc.invalidateQueries({ queryKey: ["lead-uploads", slug] });

  if (error) throw error;

  type DetailEntry = {
    id: string;
    title: string | null;
    image_url: string;
    full_image_url: string | null;
    link_url: string | null;
    status: string;
  };
  const allEntries: DetailEntry[] = [
    ...(data?.sites ?? []).map((s) => ({
      id: s.id, title: s.title, image_url: s.image_url,
      full_image_url: (s as { full_image_url?: string | null }).full_image_url ?? null,
      link_url: s.link_url,
      status: (s as { screenshot_status?: string }).screenshot_status ?? "ready",
    })),
    ...(uploads?.leadSites
      .filter((s) => s.image_url || s.link_url)
      .map((s) => ({
        id: s.id, title: s.title, image_url: s.image_url || "",
        full_image_url: (s as { full_image_url?: string | null }).full_image_url ?? null,
        link_url: s.link_url,
        status: (s as { screenshot_status?: string }).screenshot_status ?? "ready",
      })) ?? []),
  ];
  const detail = allEntries.find((s) => s.id === detailId) ?? null;


  const [tab, setTab] = useState<"board" | "mine">("board");

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

      <nav className="px-6 md:px-10 pb-2 flex items-center gap-2 max-w-[1600px] mx-auto sticky top-0 bg-background/90 backdrop-blur z-30 pt-2">
        <button
          onClick={() => setTab("board")}
          className={`font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded ${tab === "board" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          Mood board
        </button>
        <button
          onClick={() => setTab("mine")}
          className={`font-mono text-[11px] uppercase tracking-widest px-3 py-2 rounded ${tab === "mine" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
        >
          Le tue ispirazioni
          {uploads?.leadSites?.length ? ` (${uploads.leadSites.length})` : ""}
        </button>
      </nav>

      {tab === "board" ? (
        <>
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
            ) : (() => {
              const renderCard = (s: typeof data.sites[number]) => (
                <SiteCard
                  key={s.id}
                  title={s.title}
                  imageUrl={s.image_url}
                  width={s.width}
                  height={s.height}
                  liked={s.liked}
                  commentsCount={s.comments}
                  linkUrl={s.link_url}
                  status={(s as { screenshot_status?: string }).screenshot_status ?? "ready"}
                  busy={false}
                  onToggleLike={() => likeMut.mutate(s.id)}
                  onSubmitComment={async (body) => {
                    qc.setQueryData<any>(["board", slug], (old: any) => {
                      if (!old) return old;
                      return {
                        ...old,
                        sites: old.sites.map((x: any) =>
                          x.id === s.id ? { ...x, comments: x.comments + 1 } : x
                        ),
                      };
                    });
                    try {
                      await commentFn({ data: { slug, siteId: s.id, body } });
                      toast.success("Commento aggiunto");
                    } finally {
                      qc.invalidateQueries({ queryKey: ["board", slug] });
                    }
                  }}
                  onOpen={() => setDetailId(s.id)}
                />
              );
              return (
                <div className="space-y-10 md:space-y-16">
                  {data.sites.map(renderCard)}
                </div>
              );
            })()}

          </main>
        </>
      ) : (
        <section className="px-6 md:px-10 pb-24 pt-4 md:pt-10 max-w-[1600px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
            [ 02 ] — Le tue ispirazioni
          </p>
          <h2 className="font-display text-4xl md:text-6xl mt-3">
            Aggiungi siti o immagini che ti ispirano
          </h2>
          <p className="text-muted-foreground mt-3 max-w-xl">
            Carica screenshot o incolla link a siti che ti piacciono. Vedrò tutto.
          </p>

          <LeadUploader
            slug={slug}
            onAddImage={async (payload) => {
              await addLeadSiteFn({ data: { slug, ...payload } });
              invalidateUploads();
              toast.success("Aggiunto");
            }}
            onAddLink={async (payload) => {
              const res = await addLeadSiteFn({ data: { slug, ...payload } });
              invalidateUploads();
              toast.success("Link aggiunto — sto generando lo screenshot");
              const id = res?.leadSite?.id;
              if (id) {
                fetch(`/api/public/capture/lead_sites/${id}`, { method: "POST" })
                  .then(() => invalidateUploads())
                  .catch(() => {});
              }
            }}

          />

          {uploads?.leadSites && uploads.leadSites.length > 0 ? (
            <div className="masonry mt-10">
              {uploads.leadSites.map((s) => (
                <LeadUploadCard
                  key={s.id}
                  site={s}
                  onZoom={() => (s.image_url || s.link_url) && setDetailId(s.id)}
                  onDelete={async () => {
                    await delLeadSiteFn({ data: { slug, id: s.id } });
                    invalidateUploads();
                    toast.success("Rimosso");
                  }}
                  onComment={async (body) => {
                    await addLeadCommentFn({ data: { slug, leadSiteId: s.id, body } });
                    invalidateUploads();
                    toast.success("Commento aggiunto");
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic mt-10">Nessuna ispirazione ancora.</p>
          )}
        </section>
      )}

      {detail && (
        <div
          className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md animate-in fade-in"
          onClick={() => setDetailId(null)}
        >
          <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
            {detail.link_url && (
              <a
                href={detail.link_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="rounded-full bg-foreground text-background px-4 py-2 text-sm font-medium inline-flex items-center gap-2 hover:opacity-90 transition shadow-lg"
              >
                <ExternalLink className="size-4" /> Visita sito
              </a>
            )}
            <button
              onClick={() => setDetailId(null)}
              className="rounded-full bg-card border border-border p-2 hover:bg-accent transition"
              aria-label="Chiudi"
            >
              <X className="size-5" />
            </button>
          </div>
          <div
            className="h-full w-full overflow-y-auto overflow-x-hidden flex justify-center py-16 px-4 md:px-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full max-w-5xl">
              {detail.status === "pending" ? (
                <div className="aspect-[4/3] flex items-center justify-center bg-muted/30 rounded-xl border border-border">
                  <div className="text-center">
                    <Loader2 className="size-8 animate-spin mx-auto text-muted-foreground" />
                    <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-4">
                      Sto catturando lo screenshot...
                    </p>
                  </div>
                </div>
              ) : (
                <img
                  src={detail.full_image_url || detail.image_url}
                  alt={detail.title ?? "Sito"}
                  className="w-full h-auto block rounded-xl shadow-2xl"
                />
              )}
              {detail.title && (
                <p className="text-center font-mono text-[11px] uppercase tracking-widest text-muted-foreground mt-4">
                  {detail.title}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


function LeadUploader({
  slug,
  onAddImage,
  onAddLink,
}: {
  slug: string;
  onAddImage: (p: { title?: string; fileName: string; dataUrl: string; width?: number; height?: number }) => Promise<void>;
  onAddLink: (p: { title?: string; linkUrl: string }) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [linkValue, setLinkValue] = useState("");
  const [linkTitle, setLinkTitle] = useState("");

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const dataUrl: string = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = () => rej(r.error);
          r.readAsDataURL(file);
        });
        const dims = await new Promise<{ width: number; height: number }>((res) => {
          const img = new Image();
          img.onload = () => res({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = () => res({ width: 0, height: 0 });
          img.src = dataUrl;
        });
        await onAddImage({
          title: file.name.replace(/\.[^/.]+$/, "").slice(0, 120),
          fileName: file.name,
          dataUrl,
          width: dims.width || undefined,
          height: dims.height || undefined,
        });
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submitLink = async () => {
    let url = linkValue.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    setBusy(true);
    try {
      await onAddLink({ linkUrl: url, title: linkTitle.trim() || undefined });
      setLinkValue("");
      setLinkTitle("");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 grid md:grid-cols-2 gap-4">
      <label className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:bg-accent/40 transition flex flex-col items-center justify-center gap-2">
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
        />
        {busy ? (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Upload className="size-5 text-muted-foreground" />
            <p className="font-display text-xl">Carica immagini</p>
            <p className="text-xs text-muted-foreground">Screenshot o foto di siti che ti piacciono</p>
          </>
        )}
      </label>

      <div className="border border-border rounded-xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <LinkIcon className="size-5 text-muted-foreground" />
          <p className="font-display text-xl">Aggiungi link</p>
        </div>
        <Input
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
          placeholder="https://example.com"
        />
        <Input
          value={linkTitle}
          onChange={(e) => setLinkTitle(e.target.value)}
          placeholder="Titolo (opzionale)"
          maxLength={120}
        />
        <Button onClick={submitLink} disabled={!linkValue.trim() || busy} className="w-full">
          Aggiungi link
        </Button>
      </div>
    </div>
  );
}

type LeadSite = {
  id: string;
  title: string | null;
  image_url: string | null;
  link_url: string | null;
  created_at: string;
  comments: { id: string; body: string; created_at: string }[];
};

function LeadUploadCard({
  site,
  onZoom,
  onDelete,
  onComment,
}: {
  site: LeadSite;
  onZoom: () => void;
  onDelete: () => Promise<void>;
  onComment: (body: string) => Promise<void>;
}) {
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  const previewHost = site.link_url ? new URL(site.link_url).hostname.replace(/^www\./, "") : null;

  return (
    <div className="rounded-xl overflow-hidden border border-border bg-card group">
      {site.image_url ? (
        <button type="button" onClick={onZoom} className="block w-full cursor-zoom-in">
          <img src={site.image_url} alt={site.title ?? ""} className="w-full h-auto block" loading="lazy" />
        </button>
      ) : site.link_url ? (
        <a
          href={site.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-[16/10] bg-accent flex items-center justify-center text-center p-6 hover:bg-accent/70 transition"
        >
          <div>
            <ExternalLink className="size-8 mx-auto mb-3 text-muted-foreground" />
            <p className="font-display text-2xl break-all">{site.title || previewHost}</p>
            <p className="font-mono text-[11px] text-muted-foreground mt-2">{previewHost}</p>
          </div>
        </a>
      ) : null}

      {site.link_url && site.image_url && (
        <a
          href={site.link_url}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-3 py-2 border-t border-border text-xs font-mono uppercase tracking-wider hover:bg-accent inline-flex items-center gap-1.5 w-full"
        >
          <ExternalLink className="size-3.5" /> {previewHost}
        </a>
      )}

      <div className="px-3 py-2.5 flex items-center gap-1 border-t border-border">
        <button
          type="button"
          onClick={() => setComposing((v) => !v)}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium hover:bg-accent transition"
        >
          <MessageCircle className="size-4" />
          Commenta{site.comments.length > 0 ? ` (${site.comments.length})` : ""}
        </button>
        <button
          type="button"
          onClick={async () => { setBusy(true); try { await onDelete(); } finally { setBusy(false); } }}
          disabled={busy}
          className="px-3 py-2 text-destructive hover:bg-accent rounded-md"
          aria-label="Elimina"
        >
          <Trash2 className="size-4" />
        </button>
      </div>

      {composing && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Cosa ti piace di questo?"
            maxLength={500}
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setComposing(false); setBody(""); }} className="flex-1">
              <X className="size-3.5 mr-1" /> Annulla
            </Button>
            <Button
              size="sm"
              disabled={!body.trim() || busy}
              onClick={async () => {
                setBusy(true);
                try { await onComment(body.trim()); setBody(""); setComposing(false); }
                finally { setBusy(false); }
              }}
              className="flex-1"
            >
              <Send className="size-3.5 mr-1" /> Invia
            </Button>
          </div>
        </div>
      )}

      {site.comments.length > 0 && (
        <div className="px-3 pb-3 space-y-1.5 border-t border-border pt-3">
          {site.comments.map((c) => (
            <p key={c.id} className="text-sm border-l-2 border-border pl-3">{c.body}</p>
          ))}
        </div>
      )}
    </div>
  );
}
