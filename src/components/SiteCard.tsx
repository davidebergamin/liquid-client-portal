import { Heart, MessageCircle } from "lucide-react";

type Props = {
  title: string | null;
  imageUrl: string;
  width: number | null;
  height: number | null;
  liked: boolean;
  comments: number;
  onClick: () => void;
};

export function SiteCard({ title, imageUrl, width, height, liked, comments, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="group block w-full overflow-hidden rounded-xl bg-card border border-border text-left transition-all duration-300 hover:border-foreground/40 hover:-translate-y-0.5"
    >
      <div className="relative">
        <img
          src={imageUrl}
          alt={title ?? "Sito di riferimento"}
          width={width ?? undefined}
          height={height ?? undefined}
          loading="lazy"
          className="w-full h-auto block"
        />
        {liked && (
          <div className="absolute top-3 right-3 rounded-full bg-background/90 backdrop-blur px-2.5 py-1 flex items-center gap-1.5 shadow-sm">
            <Heart className="size-3.5 fill-current" style={{ color: "var(--like)" }} />
            <span className="text-[10px] font-mono uppercase tracking-wider">Ti piace</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground truncate">
          {title || "Sito"}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <Heart
            className={`size-3.5 ${liked ? "fill-current" : ""}`}
            style={liked ? { color: "var(--like)" } : undefined}
          />
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" /> {comments}
          </span>
        </div>
      </div>
    </button>
  );
}
