import { notFound } from "next/navigation";
import {
  addStyleComment,
  addCustomInspiration,
  approveProject,
  clientConfirmFinalPayment,
  clientMarkPaymentPaid,
  completeMaterials,
  completeOnboarding,
  confirmCreativeDirection,
  confirmStyleSelection,
  createMaintenance,
  createRevision,
  submitApprovalFeedback,
  getPortalProject,
  getProjectBySlug,
  toggleStyleLike,
  updateBrief,
  updateInvoice,
  uploadMaterial,
} from "@/lib/portal";
import { ClientPortalExperience } from "@/components/ClientPortalExperience";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const projectRow = await getProjectBySlug(slug);
  if (!projectRow) notFound();
  const data = await getPortalProject(projectRow);

  return (
    <ClientPortalExperience
      slug={slug}
      data={data}
      actions={{
        updateInvoice,
        updateBrief,
        uploadMaterial,
        toggleStyleLike,
        addStyleComment,
        addCustomInspiration,
        confirmCreativeDirection,
        confirmStyleSelection,
        createRevision,
        submitApprovalFeedback,
        approveProject,
        createMaintenance,
        clientConfirmFinalPayment,
        clientMarkPaymentPaid,
        completeMaterials,
        completeOnboarding,
      }}
    />
  );
}
