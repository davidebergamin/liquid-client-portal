import { useState } from "react";
import { Heart, MessageCircle, Send, X, ExternalLink, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  title: string | null;
  imageUrl: string;
  width: number | null;
  height: number | null;
  liked: boolean;
  commentsCount: number;
  busy?: boolean;
  linkUrl?: string | null;
  status?: string;
  onToggleLike: () => void;
  onSubmitComment: (body: string) => Promise<void> | void;
  onOpen: () => void;
};

export function SiteCard({
  title,
  imageUrl,
  liked,
  commentsCount,
  busy,
  linkUrl,
  status = "ready",
  onToggleLike,
  onSubmitComment,
  onOpen,
}: Props) {
  const [composing, setComposing] = useState(false);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setSending(true);
    try {
      await onSubmitComment(body.trim());
      setBody("");
      setComposing(false);
    } finally {
      setSending(false);
    }
  };

  const host = linkUrl ? new URL(linkUrl).hostname.replace(/^www\./, "") : null;
  const pending = status === "pending";

  return (
    <article className="group w-full overflow-hidden rounded-2xl bg-card border border-border transition-all duration-300 hover:border-foreground/40 hover:shadow-2xl">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full relative cursor-pointer"
        aria-label="Apri dettaglio"
      >
        <div
          className="w-full bg-muted/40 relative overflow-hidden"
          style={{ aspectRatio: "16 / 10" }}
        >
          {(!loaded || pending) && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60" />
          )}
          {pending && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="size-7 animate-spin mx-auto text-muted-foreground" />
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-3">
                  Cattura screenshot...
                </p>
              </div>
            </div>
          )}
          {!pending && (
            <img
              src={imageUrl}
              alt={title ?? "Sito di riferimento"}
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={`absolute inset-0 w-full h-full object-cover object-top block transition-opacity duration-700 ease-out group-hover:scale-[1.02] transform-gpu transition-transform ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
              draggable={false}
            />
          )}
          {liked && (
            <div className="absolute top-4 right-4 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none">
              <Heart className="size-3.5 fill-current" style={{ color: "var(--like)" }} />
              <span className="text-[10px] font-mono uppercase tracking-wider">Ti piace</span>
            </div>
          )}
          {host && (
            <div className="absolute bottom-4 left-4 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none">
              <ExternalLink className="size-3.5" />
              <span className="text-[11px] font-mono uppercase tracking-wider">{host}</span>
            </div>
          )}
        </div>
      </button>

      {(title || host) && (
        <div className="px-5 pt-4 pb-1 flex items-baseline justify-between gap-4">
          <h3 className="font-display text-2xl md:text-3xl truncate">{title || host}</h3>
          {linkUrl && (
            <a
              href={linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center gap-1 shrink-0"
            >
              Visita <ExternalLink className="size-3" />
            </a>
          )}
        </div>
      )}

      <div className="px-3 py-2.5 flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleLike}
          disabled={busy}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-medium transition ${
            liked ? "text-white" : "hover:bg-accent"
          }`}
          style={liked ? { backgroundColor: "var(--like)" } : undefined}
          aria-pressed={liked}
        >
          <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
          {liked ? "Ti piace" : "Mi piace"}
        </button>
        <button
          type="button"
          onClick={() => setComposing((v) => !v)}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2.5 text-sm font-medium transition ${
            composing ? "bg-accent" : "hover:bg-accent"
          }`}
        >
          <MessageCircle className="size-4" />
          Commenta{commentsCount > 0 ? ` (${commentsCount})` : ""}
        </button>
      </div>

      {composing && (
        <div className="px-3 pb-3 space-y-2 border-t border-border pt-3">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Cosa ti colpisce di questo stile?"
            maxLength={500}
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => { setComposing(false); setBody(""); }}
              className="flex-1"
            >
              <X className="size-3.5 mr-1" /> Annulla
            </Button>
            <Button
              size="sm"
              onClick={submit}
              disabled={!body.trim() || sending}
              className="flex-1"
            >
              <Send className="size-3.5 mr-1" /> {sending ? "Invio..." : "Invia"}
            </Button>
          </div>
        </div>
      )}
    </article>
  );
}
