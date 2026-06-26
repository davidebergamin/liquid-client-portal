"use client";

import { ClientJourneySheet } from "@/components/ClientJourneySheet";
import { cn } from "@/lib/utils";
import { stepRailAccent } from "../design/tokens";
import type { JourneyStep } from "../types";

export function StepProgressInline({
  steps,
  activeIndex,
  viewIndex,
  activeStep,
  onSelectStep,
  progress,
  checklist,
  styleReferences,
  customInspirations,
  brief,
  materialsCount,
  revisionCount,
}: {
  steps: JourneyStep[];
  activeIndex: number;
  viewIndex: number;
  activeStep: JourneyStep;
  onSelectStep: (index: number) => void;
  progress: number;
  checklist: any[];
  styleReferences: any[];
  customInspirations: any[];
  brief: Record<string, string | null> | null;
  materialsCount: number;
  revisionCount: number;
}) {
  const stepNumber = String(viewIndex + 1).padStart(2, "0");
  const total = String(steps.length).padStart(2, "0");
  const progressPct = Math.round(((viewIndex + 1) / steps.length) * 100);

  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs font-medium tracking-wider text-muted-foreground/70">
            <span className="text-foreground">{stepNumber}</span>
            <span className="mx-1 opacity-40">/</span>
            {total}
          </span>
          <div className="h-px max-w-[120px] flex-1 bg-border/60">
            <div
              className={cn("h-full rounded-full transition-all duration-700 ease-out", stepRailAccent[activeStep.accent])}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:hidden">
            {activeStep.label}
          </span>
        </div>
        <p className="mt-2 hidden text-xs font-medium uppercase tracking-wide text-muted-foreground sm:block">
          {activeStep.label}
        </p>
      </div>

      <ClientJourneySheet
        progress={progress}
        steps={steps}
        activeIndex={activeIndex}
        viewIndex={viewIndex}
        onSelectStep={onSelectStep}
        checklist={checklist}
        styleReferences={styleReferences}
        customInspirations={customInspirations}
        brief={brief}
        materialsCount={materialsCount}
        revisionCount={revisionCount}
        triggerVariant="ghost"
      />
    </div>
  );
}
