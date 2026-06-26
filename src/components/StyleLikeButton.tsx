"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function StyleLikeButton({
  slug,
  siteId,
  liked,
  toggleAction,
}: {
  slug: string;
  siteId: string;
  liked: boolean;
  toggleAction: (formData: FormData) => Promise<void>;
}) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(liked);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("slug", slug);
        formData.set("site_id", siteId);
        await toggleAction(formData);
        setIsLiked((prev) => !prev);
        router.refresh();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Impossibile aggiornare il like");
      }
    });
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={isLiked ? "default" : "outline"}
      className="gap-1.5"
      disabled={isPending}
      onClick={handleClick}
    >
      <Heart className={isLiked ? "size-3.5 fill-current" : "size-3.5"} />
      {isPending ? "…" : isLiked ? "Piaciuto" : "Like"}
    </Button>
  );
}
