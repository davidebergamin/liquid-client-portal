import { BriefAutosave } from "../shared/BriefAutosave";
import { MaterialUploader } from "../shared/MaterialUploader";
import { PortalStepCard } from "../shared/PortalStepCard";
import type { PortalActions } from "../types";

export function MaterialsStep({ slug, data, actions, isReviewingPast = false }: { slug: string; data: any; actions: PortalActions; isReviewingPast?: boolean }) {
  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PortalStepCard variant="action" className="liquid-step-card-lemon border p-6">
        <BriefAutosave slug={slug} brief={data.brief} action={actions.updateBrief} />
      </PortalStepCard>
      <PortalStepCard variant="action" className="p-6">
        <MaterialUploader
          slug={slug}
          materials={data.materials}
          uploadAction={actions.uploadMaterial}
          completeAction={actions.completeMaterials}
          showComplete={!isReviewingPast}
        />
      </PortalStepCard>
    </div>
  );
}
