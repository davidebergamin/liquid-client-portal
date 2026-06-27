"use client";

import { useEffect, useRef, useState } from "react";
import { BookCallButton } from "@/components/BookCallButton";
import { ClientJourneySheet } from "@/components/ClientJourneySheet";
import { WhatsAppButton } from "@/components/WhatsAppWidget";
import { cn } from "@/lib/utils";

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
  isMaintenanceMode = false,
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
  isMaintenanceMode?: boolean;
}) {
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const isMobile = window.matchMedia("(max-width: 639px)").matches;
      if (!isMobile) {
        setHeaderVisible(true);
        lastScrollY.current = window.scrollY;
        return;
      }

      const currentY = window.scrollY;
      if (currentY <= 10) {
        setHeaderVisible(true);
      } else if (currentY - lastScrollY.current > 8) {
        setHeaderVisible(false);
      } else if (lastScrollY.current - currentY > 8) {
        setHeaderVisible(true);
      }
      lastScrollY.current = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
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
    <>
      <header
        className={cn(
          "portal-header-glass fixed inset-x-0 top-0 z-30 px-3 py-2.5 transition-transform duration-300 ease-in-out sm:sticky sm:top-0 sm:translate-y-0 sm:px-4 md:px-8 lg:px-12",
          !headerVisible && "-translate-y-full",
        )}
      >
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
            {!isMaintenanceMode && (
              <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 sm:hidden">
                {progress}%
              </span>
            )}
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:justify-end">
            {!isMaintenanceMode && (
              <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 sm:inline-flex">
                {progress}% completato
              </span>
            )}
            <BookCallButton
              url={booking}
              className="h-10 w-full min-w-0 rounded-full bg-[var(--liquid-coral)] px-3 text-xs font-semibold text-white shadow-sm hover:bg-[var(--liquid-coral)]/90 sm:h-9 sm:w-auto sm:px-4"
            />
            <WhatsAppButton className="h-10 w-full px-3 text-xs shadow-sm sm:h-9 sm:w-auto sm:px-4" />
            {!isMaintenanceMode && (
              <>
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
              </>
            )}
          </div>
        </div>
      </header>
      <div className="h-[5.75rem] shrink-0 sm:hidden" aria-hidden />
    </>
  );
}
