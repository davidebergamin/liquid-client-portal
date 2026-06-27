import { StepLayout } from "./journey/StepLayout";
import { ApprovalStep } from "./steps/ApprovalStep";
import { DeliveryStep } from "./steps/DeliveryStep";
import { MaintenanceStep } from "./steps/MaintenanceStep";
import { MaterialsStep } from "./steps/MaterialsStep";
import { OnboardingStep } from "./steps/OnboardingStep";
import { RevisionStep } from "./steps/RevisionStep";
import { StyleStep } from "./steps/StyleStep";
import { WaitingStep } from "./steps/WaitingStep";
import type { JourneyStep, PortalActions } from "./types";

export function ClientPortalJourney({
  slug,
  data,
  actions,
  booking,
  steps,
  activeIndex,
  viewIndex,
  viewStep,
  onSelectStep,
  isMaintenanceMode,
  gatedByDeposit,
  progress,
  clientName,
}: {
  slug: string;
  data: any;
  actions: PortalActions;
  booking: string;
  steps: JourneyStep[];
  activeIndex: number;
  viewIndex: number;
  viewStep: JourneyStep;
  onSelectStep: (index: number) => void;
  isMaintenanceMode: boolean;
  gatedByDeposit: boolean;
  progress: number;
  clientName: string;
}) {
  const isReviewingPast = viewIndex < activeIndex;

  const journeyProps = {
    steps,
    activeIndex,
    viewIndex,
    activeStep: viewStep,
    onSelectStep,
    isMaintenanceMode,
    gatedByDeposit,
    progress,
    checklist: data.checklist,
    styleReferences: data.styleReferences,
    customInspirations: data.customInspirations ?? [],
    brief: data.brief,
    materialsCount: data.materials?.length ?? 0,
    revisionCount: data.revisionRequests?.length ?? 0,
  };

  return (
    <StepLayout {...journeyProps} showProgress={!isMaintenanceMode} showHeader={!isMaintenanceMode}>
      {viewStep.key === "onboarding" && (
        <OnboardingStep slug={slug} data={data} actions={actions} isReviewingPast={isReviewingPast} />
      )}
      {viewStep.key === "scelta_stile" && (
        <StyleStep slug={slug} data={data} actions={actions} isReviewingPast={isReviewingPast} />
      )}
      {viewStep.key === "raccolta_materiali" && (
        <MaterialsStep slug={slug} data={data} actions={actions} isReviewingPast={isReviewingPast} />
      )}
      {viewStep.key === "sviluppo_sito" && <WaitingStep />}
      {viewStep.key === "revisione_bozza" && (
        <RevisionStep slug={slug} data={data} actions={actions} booking={booking} isReviewingPast={isReviewingPast} />
      )}
      {viewStep.key === "approvazione_finale" && (
        <ApprovalStep slug={slug} data={data} actions={actions} isReviewingPast={isReviewingPast} />
      )}
      {viewStep.key === "pubblicazione" && (
        <DeliveryStep slug={slug} data={data} actions={actions} isReviewingPast={isReviewingPast} />
      )}
      {viewStep.key === "manutenzione_attiva" && (
        <MaintenanceStep slug={slug} data={data} actions={actions} clientName={clientName} />
      )}
    </StepLayout>
  );
}
