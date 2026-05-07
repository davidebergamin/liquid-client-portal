import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, MessageCircle, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { addComment, getSite, toggleLike } from "@/lib/board.functions";
import { getVisitorId } from "@/lib/visitor";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { it } from "date-fns/locale";

type Props = { siteId: string | null; onOpenChange: (open: boolean) => void };

export function SiteDialog({ siteId, onOpenChange }: Props) {
  const open = !!siteId;
  const qc = useQueryClient();
  const fetchSite = useServerFn(getSite);
  const likeFn = useServerFn(toggleLike);
  const commentFn = useServerFn(addComment);

  const [visitorId, setVisitorId] = useState("");
  useEffect(() => { if (open) setVisitorId(getVisitorId()); }, [open]);

  const { data, isLoading } = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => fetchSite({ data: { id: siteId! } }),
    enabled: !!siteId,
  });

  const liked = !!data && visitorId && data.likes.includes(visitorId);

  const likeMut = useMutation({
    mutationFn: () => likeFn({ data: { siteId: siteId!, visitorId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site", siteId] });
      qc.invalidateQueries({ queryKey: ["sites"] });
    },
  });

  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const commentMut = useMutation({
    mutationFn: () =>
      commentFn({ data: { siteId: siteId!, authorName: name.trim(), body: body.trim() } }),
    onSuccess: () => {
      setBody("");
      toast.success("Commento aggiunto");
      qc.invalidateQueries({ queryKey: ["site", siteId] });
      qc.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
                  [ Sito ]
                </p>
                <h2 className="font-display text-4xl md:text-5xl mt-2 leading-[0.95]">
                  {data.site.title || "Senza titolo"}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => likeMut.mutate()}
                  disabled={likeMut.isPending || !visitorId}
                  variant={liked ? "default" : "outline"}
                  className={liked ? "" : ""}
                  style={liked ? { backgroundColor: "var(--like)", color: "white" } : undefined}
                >
                  <Heart className={`size-4 mr-2 ${liked ? "fill-current" : ""}`} />
                  {liked ? "Ti piace" : "Mi piace"}
                  <span className="ml-2 opacity-70">{data.likes.length}</span>
                </Button>
                <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <MessageCircle className="size-4" /> {data.comments.length} commenti
                </span>
              </div>

              <div className="space-y-3 border-t border-border pt-6">
                <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                  Lascia un commento
                </p>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Il tuo nome"
                  maxLength={60}
                />
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Cosa pensi di questo stile?"
                  maxLength={500}
                  rows={3}
                />
                <Button
                  onClick={() => commentMut.mutate()}
                  disabled={commentMut.isPending || !name.trim() || !body.trim()}
                  className="w-full"
                >
                  {commentMut.isPending ? "Invio..." : "Invia commento"}
                </Button>
              </div>

              <div className="space-y-4 border-t border-border pt-6">
                {data.comments.length === 0 && (
                  <p className="text-sm text-muted-foreground italic">Nessun commento ancora.</p>
                )}
                {data.comments.map((c) => (
                  <div key={c.id} className="space-y-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-medium text-sm">{c.author_name}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {formatDistanceToNow(new Date(c.created_at), { locale: it, addSuffix: true })}
                      </span>
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
