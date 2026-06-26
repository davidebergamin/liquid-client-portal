"use client";

import { ExternalLink, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CopyInlineButton } from "@/components/CopyInlineButton";

type StyleComment = { id: string; body: string };

type Props = {
  id: string;
  title?: string | null;
  imageUrl?: string | null;
  linkUrl?: string | null;
  liked?: boolean;
  comments?: StyleComment[];
  compact?: boolean;
};

export function AdminStyleReferenceCard({
  title,
  imageUrl,
  linkUrl,
  liked,
  comments = [],
  compact = false,
}: Props) {
  const host = linkUrl
    ? (() => {
        try {
          return new URL(linkUrl).hostname.replace(/^www\./, "");
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <article className="overflow-hidden rounded-xl border border-border bg-background shadow-sm transition-colors hover:border-primary/20">
      {imageUrl ? (
        <a
          href={imageUrl}
          target="_blank"
          rel="noreferrer"
          className="group block bg-muted/30"
          title="Apri immagine a dimensione piena"
        >
          <div className={compact ? "aspect-[16/10] w-full" : "aspect-[16/10] w-full sm:aspect-[4/3]"}>
            <img
              src={imageUrl}
              alt={title ?? "Riferimento stile"}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-contain object-center transition-transform duration-300 group-hover:scale-[1.01]"
            />
          </div>
        </a>
      ) : (
        <div className="flex aspect-[16/10] items-center justify-center bg-muted/40 px-4 text-center text-sm text-muted-foreground">
          Nessuna anteprima disponibile
        </div>
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight sm:text-2xl">{title || host || "Riferimento"}</p>
            {host && <p className="mt-1 truncate font-mono text-[11px] uppercase tracking-wider text-muted-foreground">{host}</p>}
          </div>
          {liked && (
            <Badge className="shrink-0 gap-1">
              <Heart className="size-3 fill-current" />
              Like
            </Badge>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {linkUrl && (
            <Button asChild size="sm" variant="default">
              <a href={linkUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="size-3.5" />
                Apri sito
              </a>
            </Button>
          )}
          {imageUrl && <CopyInlineButton value={imageUrl} label="Copia immagine" />}
        </div>

        {comments.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            {comments.map((comment) => (
              <p key={comment.id} className="border-l-2 border-primary/25 pl-3 text-sm text-muted-foreground">
                {comment.body}
              </p>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
