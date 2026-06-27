"use client";

import { BookCallButton } from "@/components/BookCallButton";
import { ClientJourneySheet } from "@/components/ClientJourneySheet";
import { WhatsAppButton } from "@/components/WhatsAppWidget";

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
    <header className="portal-header-glass sticky top-0 z-30 px-3 py-2.5 sm:px-4 md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center justify-between gap-3 sm:flex-1 sm:justify-start">
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
          <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 sm:hidden">
            {progress}%
          </span>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
          <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex">
            {progress}% completato
          </span>
          <BookCallButton
            url={booking}
            className="h-10 w-full min-w-0 rounded-full bg-[var(--liquid-coral)] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[var(--liquid-coral)]/90 sm:h-9 sm:w-auto sm:px-4"
          />
          <WhatsAppButton className="h-10 w-full px-3 text-xs shadow-sm sm:h-9 sm:w-auto sm:px-4" />
          <ClientJourneySheet
            {...sheetProps}
            triggerVariant="ghost"
            triggerLabel="Inserito"
            contentMode="activity"
            triggerClassName="h-10 w-full justify-center rounded-full border border-border bg-background/70 px-3 text-xs text-foreground shadow-sm hover:bg-accent sm:h-9 sm:w-auto"
          />
          <ClientJourneySheet
            {...sheetProps}
            triggerVariant="ghost"
            triggerLabel="Checklist"
            contentMode="checklist"
            triggerClassName="h-10 w-full justify-center rounded-full border border-border bg-background/70 px-3 text-xs text-foreground shadow-sm hover:bg-accent sm:h-9 sm:w-auto"
          />
        </div>
      </div>
    </header>
  );
}
