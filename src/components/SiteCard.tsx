import { Heart, MessageCircle } from "lucide-react";

type Props = {
  title: string | null;
  imageUrl: string;
  width: number | null;
  height: number | null;
  likes: number;
  comments: number;
  onClick: () => void;
};

export function SiteCard({ title, imageUrl, width, height, likes, comments, onClick }: Props) {
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
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground truncate">
          {title || "Sito"}
        </span>
        <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
          <span className="inline-flex items-center gap-1">
            <Heart className="size-3.5" /> {likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="size-3.5" /> {comments}
          </span>
        </div>
      </div>
    </button>
  );
}
