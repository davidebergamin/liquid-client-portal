"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function ChecklistItemToggle({
  id,
  projectId,
  label,
  completed,
  action,
}: {
  id: string;
  projectId: string;
  label: string;
  completed: boolean;
  action: (formData: FormData) => Promise<void>;
}) {
  const [checked, setChecked] = useState(completed);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !checked;
    setChecked(next);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("id", id);
      fd.set("project_id", projectId);
      if (next) fd.set("completed", "on");
      await action(fd);
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all",
        "hover:border-primary/30 hover:shadow-md",
        checked
          ? "border-secondary bg-secondary/20 shadow-sm"
          : "border-border bg-background shadow-sm shadow-primary/5",
      )}
    >
      <span
        className={cn(
          "grid size-5 shrink-0 place-items-center rounded-full border transition-all",
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
      <span
        className={cn(
          "flex-1 leading-snug",
          checked ? "text-muted-foreground line-through decoration-muted-foreground/60" : "",
        )}
      >
        {label}
      </span>
    </button>
  );
}
