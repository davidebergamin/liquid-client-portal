import { cn } from "@/lib/utils";
import { portalCopy } from "./copy";
import { PortalStepCard } from "./shared/PortalStepCard";
import type { JourneyStep } from "./types";

const accentBadge: Record<JourneyStep["accent"], string> = {
  coral: "bg-[var(--liquid-coral)]/20 text-orange-900",
  mint: "bg-[var(--liquid-mint)]/30 text-emerald-900",
  lemon: "bg-[var(--liquid-lemon)]/40 text-yellow-900",
  indigo: "bg-[var(--liquid-indigo)]/15 text-indigo-900",
  gradient: "liquid-cta-gradient text-white",
};

export function ClientPortalHero({
  step,
  stepIndex,
  summary,
}: {
  step: JourneyStep;
  stepIndex: number;
  summary: string;
}) {
  return (
    <PortalStepCard
      variant="hero"
      accent={step.accent}
      showAccentLine
      className={cn("mb-8 p-6 sm:p-8", step.accent === "gradient" && "liquid-step-card-coral")}
    >
      <div className="flex items-center gap-2.5">
        <span className={cn("grid size-8 place-items-center rounded-full font-mono text-xs font-semibold", accentBadge[step.accent])}>
          {String(stepIndex + 1).padStart(2, "0")}
        </span>
        <p className="text-sm font-medium text-primary">{step.label}</p>
      </div>
      <h2 className="mt-4 font-display text-3xl leading-tight sm:text-5xl">{step.title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">{summary}</p>
    </PortalStepCard>
  );
}

export function getHeroSummary({
  isMaintenanceMode,
  gatedByDeposit,
  activeStep,
}: {
  isMaintenanceMode: boolean;
  gatedByDeposit: boolean;
  activeStep: JourneyStep;
}) {
  if (isMaintenanceMode) return portalCopy.maintenance.summary;
  if (gatedByDeposit) return portalCopy.gatedDeposit;
  return activeStep.summary;
}
