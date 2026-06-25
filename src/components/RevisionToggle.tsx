"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function RevisionToggle({
  id,
  projectId,
  page,
  section,
  comment,
  priority,
  status,
  action,
}: {
  id: string;
  projectId: string;
  page: string;
  section?: string | null;
  comment: string;
  priority: string;
  status: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [checked, setChecked] = useState(status === "completata");
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("project_id", projectId);
      fd.set("status", next ? "completata" : "in_lavorazione");
      await action(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all",
        "hover:border-primary/30",
        checked
          ? "border-secondary bg-secondary/20 opacity-60"
          : "border-border bg-background shadow-sm shadow-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 grid size-5 shrink-0 place-items-center rounded-full border transition-all",
          isPending
            ? "border-muted-foreground/40 bg-muted"
            : checked
              ? "border-transparent bg-primary text-primary-foreground"
              : "border-border bg-background",
        )}
      >
        {isPending ? (
          <Loader2 className="size-3 animate-spin text-muted-foreground" />
        ) : checked ? (
          <Check className="size-3" />
        ) : null}
      </span>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium", checked && "text-muted-foreground line-through decoration-muted-foreground/60")}>
          {page}{section ? ` · ${section}` : ""}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{comment}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
          Priorità: {priority} · {checked ? "Completata" : "In lavorazione"}
        </p>
      </div>
    </button>
  );
}
