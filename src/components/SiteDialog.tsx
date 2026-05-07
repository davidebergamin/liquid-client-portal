import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, MessageCircle, Loader2, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment, deleteOwnComment, getSiteForLead, toggleLike } from "@/lib/board.functions";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

type Props = { slug: string; siteId: string | null; onOpenChange: (open: boolean) => void };

export function SiteDialog({ slug, siteId, onOpenChange }: Props) {
  const open = !!siteId;
  const qc = useQueryClient();
  const fetchSite = useServerFn(getSiteForLead);
  const likeFn = useServerFn(toggleLike);
  const commentFn = useServerFn(addComment);
  const delCommentFn = useServerFn(deleteOwnComment);

  const { data, isLoading } = useQuery({
    queryKey: ["site", slug, siteId],
    queryFn: () => fetchSite({ data: { slug, id: siteId! } }),
    enabled: !!siteId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["site", slug, siteId] });
    qc.invalidateQueries({ queryKey: ["board", slug] });
  };

  const likeMut = useMutation({
    mutationFn: () => likeFn({ data: { slug, siteId: siteId! } }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });

  const [body, setBody] = useState("");
  const commentMut = useMutation({
    mutationFn: () => commentFn({ data: { slug, siteId: siteId!, body: body.trim() } }),
    onSuccess: () => {
      setBody("");
      toast.success("Commento aggiunto");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delCommentMut = useMutation({
    mutationFn: (id: string) => delCommentFn({ data: { slug, id } }),
    onSuccess: invalidate,
  });

  const liked = !!data?.liked;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[96vw] max-h-[92vh] overflow-y-auto p-0 bg-background border-border">
        <DialogTitle className="sr-only">{data?.site.title || "Sito"}</DialogTitle>

        {isLoading || !data ? (
          <div className="flex items-center justify-center h-96">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid md:grid-cols-[1.5fr_1fr] gap-0">
            <div className="bg-muted/40 p-6 md:p-10 flex items-center justify-center">
              <img
                src={data.site.image_url}
                alt={data.site.title ?? "Sito"}
                className="max-w-full max-h-[80vh] w-auto h-auto object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="p-6 md:p-10 flex flex-col gap-6 border-t md:border-t-0 md:border-l border-border">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Ciao {data.lead.name}
                </p>
                <h2 className="font-display text-4xl md:text-5xl mt-2 leading-[0.95]">
                  {data.site.title || "Senza titolo"}
                </h2>
              </div>

              <button
                onClick={() => likeMut.mutate()}
                disabled={likeMut.isPending}
                className={`group flex items-center gap-3 rounded-xl border-2 px-5 py-4 transition-all ${
                  liked
                    ? "border-transparent text-white"
                    : "border-border hover:border-foreground/40"
                }`}
                style={liked ? { backgroundColor: "var(--like)" } : undefined}
              >
                <Heart className={`size-6 transition-transform ${liked ? "fill-current scale-110" : "group-hover:scale-110"}`} />
                <div className="text-left">
                  <p className="font-display text-xl leading-none">
                    {liked ? "Mi piace!" : "Mi piace"}
                  </p>
                  <p className={`text-xs mt-1 ${liked ? "text-white/80" : "text-muted-foreground"}`}>
                    {liked ? "Tocca per rimuovere" : "Salva tra i tuoi preferiti"}
                  </p>
                </div>
              </button>

              <div className="space-y-3 border-t border-border pt-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Lascia un commento
                </p>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Cosa ti colpisce di questo stile?"
                  maxLength={500}
                  rows={3}
                />
                <Button
                  onClick={() => commentMut.mutate()}
                  disabled={commentMut.isPending || !body.trim()}
                  className="w-full"
                >
                  {commentMut.isPending ? "Invio..." : "Invia commento"}
                </Button>
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground inline-flex items-center gap-1.5">
                  <MessageCircle className="size-3" /> I tuoi commenti ({data.comments.length})
                </p>
                {data.comments.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Non hai ancora commentato.</p>
                )}
                {data.comments.map((c) => (
                  <div key={c.id} className="group space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { locale: it, addSuffix: true })}
                      </span>
                      <button
                        onClick={() => delCommentMut.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                        aria-label="Elimina commento"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                    <p className="text-sm text-foreground/80 leading-relaxed">{c.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
