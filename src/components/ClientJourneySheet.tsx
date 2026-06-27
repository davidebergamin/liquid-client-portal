"use client";

import Link from "next/link";
import { Check, ClipboardList, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type JourneyStep = { key: string; label: string };
type ChecklistItem = { id: string; label: string; completed: boolean };
type StyleRef = { id: string; title?: string | null; liked: boolean; comments: Array<{ body: string }> };
type ActivityItem = { label: string; detail: string; at?: string };

export function ClientJourneySheet({
  progress,
  checklist,
  styleReferences,
  customInspirations,
  brief,
  materialsCount,
  revisionCount,
  triggerVariant = "outline",
  triggerLabel,
  contentMode = "all",
}: {
  progress: number;
  steps: JourneyStep[];
  activeIndex: number;
  viewIndex?: number;
  onSelectStep?: (index: number) => void;
  checklist: ChecklistItem[];
  styleReferences: StyleRef[];
  customInspirations: Array<{ body: string }>;
  brief: Record<string, string | null> | null;
  materialsCount: number;
  revisionCount: number;
  triggerVariant?: "outline" | "ghost";
  triggerLabel?: string;
  contentMode?: "all" | "activity" | "checklist";
}) {
  const likedRefs = styleReferences.filter((ref) => ref.liked);
  const commentedRefs = styleReferences.filter((ref) => ref.comments.length > 0);
  const briefFields = brief
    ? [
        ["Attività", brief.business_description],
        ["Servizi", brief.main_services],
        ["Obiettivo sito", brief.website_goal],
        ["Pubblico", brief.ideal_audience],
        ["Messaggio", brief.message_to_communicate],
        ["CTA principale", brief.main_cta],
        ["Note", brief.free_notes],
      ].filter(([, value]) => value)
    : [];

  const activity: ActivityItem[] = [
    ...likedRefs.map((ref) => ({ label: "Like stile", detail: ref.title || "Riferimento" })),
    ...commentedRefs.flatMap((ref) =>
      ref.comments.map((comment) => ({
        label: `Commento su ${ref.title || "riferimento"}`,
        detail: comment.body,
      })),
    ),
    ...customInspirations.map((item) => ({ label: "Link ispirazione", detail: item.body })),
    ...briefFields.map(([label, value]) => ({ label: String(label), detail: String(value) })),
    ...(materialsCount > 0 ? [{ label: "Materiali", detail: `${materialsCount} file caricati` }] : []),
    ...(revisionCount > 0 ? [{ label: "Revisioni", detail: `${revisionCount} richieste inviate` }] : []),
  ];
  const showChecklist = contentMode === "all" || contentMode === "checklist";
  const showActivity = contentMode === "all" || contentMode === "activity";
  const title = contentMode === "checklist" ? "Checklist" : contentMode === "activity" ? "Cosa hai inserito" : "Riepilogo";
  const description = contentMode === "checklist"
    ? "Le cose già completate e quelle che mancano."
    : contentMode === "activity"
      ? "Stile scelto, materiali, testi e link che hai condiviso."
      : "Avanzamento e contenuti condivisi finora.";

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant={triggerVariant}
          size="sm"
          className={
            triggerVariant === "ghost"
              ? "h-8 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              : "h-7 gap-1.5 border-primary/20 px-3 text-[11px] hover:bg-primary/5"
          }
        >
          <ClipboardList className={triggerVariant === "ghost" ? "size-3.5" : "size-3.5 text-primary"} />
          {triggerLabel ?? (triggerVariant === "ghost" ? "Cosa hai inserito" : "Il tuo percorso")}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-3xl">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="rounded-xl border border-primary/15 bg-gradient-to-br from-primary/5 to-secondary/10 p-4">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Avanzamento</span>
              <span className="font-semibold text-primary">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="liquid-progress-bar h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {showChecklist && (
          <div>
            <p className="mb-3 text-sm font-medium text-muted-foreground">Checklist</p>
            <div className="space-y-1.5">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs ${
                    item.completed ? "bg-emerald-50 text-emerald-800" : "text-muted-foreground"
                  }`}
                >
                  <span
                    className={`grid size-4 shrink-0 place-items-center rounded-full border ${
                      item.completed ? "border-emerald-300 bg-emerald-100" : "border-border"
                    }`}
                  >
                    {item.completed && <Check className="size-2.5" />}
                  </span>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          )}

          {showActivity && activity.length > 0 && (
            <div>
              <p className="mb-3 text-sm font-medium text-muted-foreground">Cosa hai inserito</p>
              <div className="space-y-2">
                {activity.map((item, index) => (
                  <div key={`${item.label}-${index}`} className="rounded-lg border border-border bg-background p-3">
                    <p className="text-xs font-medium text-primary">{item.label}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
                    {item.detail.startsWith("http") && (
                      <Link href={item.detail} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline">
                        <ExternalLink className="size-3" /> Apri link
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
