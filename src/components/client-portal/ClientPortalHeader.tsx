"use client";

import { BookCallButton } from "@/components/BookCallButton";
import { ClientJourneySheet } from "@/components/ClientJourneySheet";

export function ClientPortalHeader({
  clientName,
  booking,
  progress,
  steps,
  activeIndex,
  viewIndex,
  onSelectStep,
  checklist,
  styleReferences,
  customInspirations,
  brief,
  materialsCount,
  revisionCount,
}: {
  clientName: string;
  booking: string;
  progress: number;
  steps: any[];
  activeIndex: number;
  viewIndex: number;
  onSelectStep: (index: number) => void;
  checklist: any[];
  styleReferences: any[];
  customInspirations: any[];
  brief: Record<string, string | null> | null;
  materialsCount: number;
  revisionCount: number;
}) {
  const sheetProps = {
    progress,
    steps,
    activeIndex,
    viewIndex,
    onSelectStep,
    checklist,
    styleReferences,
    customInspirations,
    brief,
    materialsCount,
    revisionCount,
  };

  return (
    <header className="portal-header-glass sticky top-0 z-30 px-4 py-3 md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[var(--liquid-coral)]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
              LIQUID
            </span>
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="truncate text-sm font-medium text-foreground/90">{clientName}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
            {progress}% completato
          </span>
          <ClientJourneySheet {...sheetProps} triggerVariant="ghost" triggerLabel="Cosa hai inserito" contentMode="activity" />
          <ClientJourneySheet {...sheetProps} triggerVariant="ghost" triggerLabel="Checklist" contentMode="checklist" />
          <BookCallButton
            url={booking}
            className="h-9 shrink-0 rounded-full bg-[var(--liquid-coral)] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[var(--liquid-coral)]/90"
          />
        </div>
      </div>
    </header>
  );
}
