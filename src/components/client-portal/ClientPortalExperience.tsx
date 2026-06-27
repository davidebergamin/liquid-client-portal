"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { bookingUrl } from "@/components/BookCallButton";
import { maintenanceStep, portalSteps, statusOrder } from "./constants";
import { ClientPortalHeader } from "./ClientPortalHeader";
import { ClientPortalJourney } from "./ClientPortalJourney";
import { ClientWelcomeScreen } from "./ClientWelcomeScreen";
import type { PortalActions } from "./types";

export function ClientPortalExperience({
  slug,
  data,
  actions,
}: {
  slug: string;
  data: any;
  actions: PortalActions;
}) {
  const completed = data.checklist.filter((item: any) => item.completed).length;
  const progress = Math.round((completed / Math.max(data.checklist.length, 1)) * 100);
  const booking = bookingUrl(data.settings);
  const depositPaid = data.payments.some((p: any) => p.type === "acconto" && p.status === "pagato");
  const gatedByDeposit = !depositPaid && data.project.status === "onboarding";
  const isMaintenanceMode = data.project.status === "manutenzione_attiva" || data.project.maintenance_active;
  const activeIndex = isMaintenanceMode
    ? portalSteps.length - 1
    : Math.max(statusOrder.indexOf(data.project.status as typeof statusOrder[number]), 0);

  const steps = useMemo(() => portalSteps, []);
  const activeStep = steps[activeIndex];
  const [viewIndex, setViewIndex] = useState(activeIndex);
  const previousActiveIndex = useRef(activeIndex);

  useEffect(() => {
    if (activeIndex > previousActiveIndex.current) {
      setViewIndex(activeIndex);
    }
    previousActiveIndex.current = activeIndex;
  }, [activeIndex]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [viewIndex]);

  const viewStep = isMaintenanceMode ? maintenanceStep : steps[viewIndex] ?? activeStep;

  const hasOnboardingProgress =
    data.checklist.some((item: any) => item.completed) ||
    data.payments.some((p: any) => p.type === "acconto" && (p.status === "pagato" || p.client_marked_paid_at)) ||
    Boolean(data.invoice?.billing_name || data.invoice?.billing_email || data.invoice?.vat_number);

  const showWelcome =
    data.project.status === "onboarding" &&
    !data.project.portal_welcome_seen_at &&
    !hasOnboardingProgress &&
    data.capabilities?.portalWelcomeSeen !== false;

  const personName = String(data.project.name ?? "").trim().split(/\s+/)[0];
  const clientName = personName || data.project.company_name || "lì";

  return (
    <main className={showWelcome ? "portal-welcome-bg portal-grain relative min-h-screen overflow-hidden" : "portal-mesh-bg portal-grain relative min-h-screen"}>
      {!showWelcome && (
        <ClientPortalHeader
          clientName={clientName}
          booking={booking}
          progress={progress}
          steps={steps}
          activeIndex={activeIndex}
          viewIndex={viewIndex}
          onSelectStep={setViewIndex}
          checklist={data.checklist}
          styleReferences={data.styleReferences}
          customInspirations={data.customInspirations ?? []}
          brief={data.brief}
          materialsCount={data.materials?.length ?? 0}
          revisionCount={data.revisionRequests?.length ?? 0}
        />
      )}

      {showWelcome ? (
        <ClientWelcomeScreen
          slug={slug}
          clientName={clientName}
          markWelcomeSeen={actions.markPortalWelcomeSeen}
        />
      ) : (
        <ClientPortalJourney
          slug={slug}
          data={data}
          actions={actions}
          booking={booking}
          steps={steps}
          activeIndex={activeIndex}
          viewIndex={viewIndex}
          viewStep={viewStep}
          onSelectStep={setViewIndex}
          isMaintenanceMode={isMaintenanceMode}
          gatedByDeposit={gatedByDeposit}
          progress={progress}
          clientName={clientName}
        />
      )}
    </main>
  );
}
