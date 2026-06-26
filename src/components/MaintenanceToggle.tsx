"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function MaintenanceToggle({
  id,
  projectId,
  title,
  description,
  requestType,
  priority,
  status,
  attachments,
  action,
  compact = false,
}: {
  id: string;
  projectId: string;
  title: string;
  description: string;
  requestType: string;
  priority: string;
  status: string;
  attachments?: Array<{ id: string; file_name: string; signed_url?: string | null }>;
  action: (formData: FormData) => Promise<void>;
  compact?: boolean;
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
      fd.set("status", next ? "completata" : "ricevuta");
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
        compact ? "items-center p-3" : "items-start",
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
        {compact ? (
          <p className={cn("text-sm font-medium", checked && "text-muted-foreground line-through")}>
            {checked ? "Completata" : "Segna come completata"}
          </p>
        ) : (
          <>
            <p className={cn("font-medium", checked && "text-muted-foreground line-through decoration-muted-foreground/60")}>
              {title}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{description}</p>
            <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
              {requestType} · priorità {priority} · {checked ? "Completata" : "Aperta"}
            </p>
            {attachments && attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.signed_url ?? "#"}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(event) => event.stopPropagation()}
                    className="rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent"
                  >
                    {attachment.file_name}
                  </a>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </button>
  );
}
