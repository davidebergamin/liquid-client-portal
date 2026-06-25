"use client";

import { AlertCircle, Check, Loader2 } from "lucide-react";
import type { AutosaveState } from "@/hooks/use-autosave";

export function SaveStatus({ state }: { state: AutosaveState }) {
  if (state === "idle") return null;

  const copy = {
    saving: "Salvataggio…",
    saved: "Salvato",
    error: "Errore salvataggio",
  }[state];

  const Icon = state === "saving" ? Loader2 : state === "saved" ? Check : AlertCircle;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
      <Icon className={`size-3.5 ${state === "saving" ? "animate-spin" : ""}`} />
      {copy}
    </span>
  );
}
