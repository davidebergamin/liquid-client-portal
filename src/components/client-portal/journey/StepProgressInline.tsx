"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { stepRailAccent } from "../design/tokens";
import type { JourneyStep } from "../types";

export function StepProgressInline({
  steps,
  activeIndex,
  viewIndex,
  activeStep,
  onSelectStep,
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
  const canGoBack = viewIndex > 0;
  const canGoForward = viewIndex < activeIndex;

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

      <div className="flex items-center gap-2 self-start sm:self-auto">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          disabled={!canGoBack}
          onClick={() => onSelectStep(viewIndex - 1)}
          aria-label="Vai allo step precedente"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 rounded-full"
          disabled={!canGoForward}
          onClick={() => onSelectStep(viewIndex + 1)}
          aria-label="Vai allo step successivo"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
