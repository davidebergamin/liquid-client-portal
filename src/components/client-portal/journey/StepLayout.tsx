"use client";

import { cn } from "@/lib/utils";
import { stepAccentBg } from "../design/tokens";
import { getHeroSummary } from "../ClientPortalHero";
import type { JourneyStep } from "../types";
import { StepProgressInline } from "./StepProgressInline";

export function StepLayout({
  steps,
  activeIndex,
  viewIndex,
  activeStep,
  onSelectStep,
  isMaintenanceMode,
  gatedByDeposit,
  progress,
  checklist,
  styleReferences,
  customInspirations,
  brief,
  materialsCount,
  revisionCount,
  showProgress = true,
  showHeader = true,
  children,
}: {
  steps: JourneyStep[];
  activeIndex: number;
  viewIndex: number;
  activeStep: JourneyStep;
  onSelectStep: (index: number) => void;
  isMaintenanceMode: boolean;
  gatedByDeposit: boolean;
  progress: number;
  checklist: any[];
  styleReferences: any[];
  customInspirations: any[];
  brief: Record<string, string | null> | null;
  materialsCount: number;
  revisionCount: number;
  showProgress?: boolean;
  showHeader?: boolean;
  children: React.ReactNode;
}) {
  const summary = getHeroSummary({ isMaintenanceMode, gatedByDeposit, activeStep });

  return (
    <div className={cn("portal-enter min-h-[calc(100vh-5rem)] px-4 pb-32 pt-6 md:px-8 md:pt-10 lg:px-12", stepAccentBg[activeStep.accent])}>
      <div className="mx-auto w-full max-w-6xl">
        {showProgress && (
          <StepProgressInline
            steps={steps}
            activeIndex={activeIndex}
            viewIndex={viewIndex}
            activeStep={activeStep}
            onSelectStep={onSelectStep}
            progress={progress}
            checklist={checklist}
            styleReferences={styleReferences}
            customInspirations={customInspirations}
            brief={brief}
            materialsCount={materialsCount}
            revisionCount={revisionCount}
          />
        )}

        {showHeader && (
          <header className="mb-10 md:mb-14">
            <h1 className="font-display text-4xl leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
              {activeStep.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {summary}
            </p>
          </header>
        )}

        {children}
      </div>
    </div>
  );
}
