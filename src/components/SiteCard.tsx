import { useState } from "react";
import { Heart, MessageCircle, Send, X, ExternalLink } from "lucide-react";
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
  onToggleLike: () => void;
  onSubmitComment: (body: string) => Promise<void> | void;
  onZoom: () => void;
};

export function SiteCard({
  title,
  imageUrl,
  width,
  height,
  liked,
  commentsCount,
  busy,
  linkUrl,
  onToggleLike,
  onSubmitComment,
  onZoom,
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

  const ratio = width && height ? `${width} / ${height}` : "4 / 3";

  const imgInner = (
    <>
      <div
        className="w-full bg-muted/40 relative overflow-hidden"
        style={{ aspectRatio: ratio }}
      >
        {!loaded && (
          <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60" />
        )}
        <img
          src={imageUrl}
          alt={title ?? "Sito di riferimento"}
          width={width ?? undefined}
          height={height ?? undefined}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover block transition-opacity duration-700 ease-out ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
          draggable={false}
        />
      </div>
      {liked && (
        <div className="absolute top-3 right-3 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 flex items-center gap-1.5 shadow-sm pointer-events-none">
          <Heart className="size-3.5 fill-current" style={{ color: "var(--like)" }} />
          <span className="text-[10px] font-mono uppercase tracking-wider">Ti piace</span>
        </div>
      )}
      {linkUrl && (
        <div className="absolute top-3 left-3 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 flex items-center gap-1.5 shadow-sm pointer-events-none">
          <ExternalLink className="size-3.5" />
          <span className="text-[10px] font-mono uppercase tracking-wider">Visita</span>
        </div>
      )}
    </>
  );

  return (
    <div className="group block w-full overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 hover:border-foreground/40">
      {linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full relative"
          aria-label="Visita il sito"
        >
          {imgInner}
        </a>
      ) : (
        <button
          type="button"
          onClick={onZoom}
          className="block w-full relative cursor-zoom-in"
          aria-label="Ingrandisci immagine"
        >
          {imgInner}
        </button>
      )}

      <div className="px-3 py-2.5 flex items-center gap-1">
        <button
          type="button"
          onClick={onToggleLike}
          disabled={busy}
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${
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
          className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${
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
    </div>
  );
}
