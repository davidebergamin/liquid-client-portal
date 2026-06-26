"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { portalCopy } from "../copy";

export function UploadCategory({
  slug,
  category,
  title,
  description,
  count,
  action,
}: {
  slug: string;
  category: string;
  title: string;
  description: string;
  count: number;
  action: (formData: FormData) => Promise<void>;
}) {
  const [uploaded, setUploaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <form
      action={(fd) => {
        startTransition(async () => {
          try {
            await action(fd);
            setUploaded(true);
            toast.success(portalCopy.toasts.uploadSuccess);
            if (inputRef.current) inputRef.current.value = "";
            router.refresh();
          } catch (error) {
            toast.error(error instanceof Error ? error.message : portalCopy.toasts.uploadError);
            if (inputRef.current) inputRef.current.value = "";
          }
        });
      }}
      className={`rounded-2xl border p-4 transition-all ${uploaded || count > 0 ? "border-emerald-200 bg-emerald-50/50 shadow-sm shadow-emerald-100" : "border-border bg-background hover:border-primary/20 hover:shadow-sm"}`}
    >
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="category" value={category} />
      <div className="grid gap-3 md:grid-cols-[1fr_260px] md:items-center">
        <div className="flex gap-3">
          <span className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border ${uploaded || count > 0 ? "border-emerald-300 bg-emerald-100 text-emerald-700" : "border-border text-muted-foreground"}`}>
            <Check className="size-3.5" />
          </span>
          <div>
            <p className="font-medium">{title}</p>
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            {(uploaded || count > 0) && <p className="mt-1 text-xs font-medium text-emerald-700">{count || "Nuovo"} file caricato. Avanti così.</p>}
          </div>
        </div>
        <Input
          ref={inputRef}
          name="files"
          type="file"
          multiple
          disabled={isPending}
          className="h-12 cursor-pointer text-sm sm:h-10"
          onChange={(event) => {
            const files = event.currentTarget.files;
            if (!files?.length) return;
            event.currentTarget.form?.requestSubmit();
          }}
        />
      </div>
      {isPending && (
        <p className="mt-2 text-xs text-muted-foreground">Caricamento in corso…</p>
      )}
    </form>
  );
}
