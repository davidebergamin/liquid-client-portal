"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { bookingUrl } from "@/components/BookCallButton";
import { portalSteps, statusOrder } from "./constants";
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
  const activeIndex = Math.max(statusOrder.indexOf(data.project.status as typeof statusOrder[number]), 0);
  const isMaintenanceMode = data.project.status === "manutenzione_attiva";

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

  const viewStep = steps[viewIndex] ?? activeStep;

  const hasOnboardingProgress =
    data.checklist.some((item: any) => item.completed) ||
    data.payments.some((p: any) => p.type === "acconto" && (p.status === "pagato" || p.client_marked_paid_at)) ||
    Boolean(data.invoice?.billing_name || data.invoice?.billing_email || data.invoice?.vat_number);

  const showWelcome =
    data.project.status === "onboarding" &&
    !data.project.portal_welcome_seen_at &&
    !hasOnboardingProgress &&
    data.capabilities?.portalWelcomeSeen !== false;

  const clientName =
    data.project.company_name ||
    data.project.name ||
    "lì";

  return (
    <main className={showWelcome ? "portal-welcome-bg portal-grain relative min-h-screen overflow-hidden" : "portal-mesh-bg portal-grain relative min-h-screen"}>
      {!showWelcome && (
        <ClientPortalHeader clientName={clientName} booking={booking} />
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
          activeStep={activeStep}
          viewIndex={viewIndex}
          viewStep={viewStep}
          onSelectStep={setViewIndex}
          isMaintenanceMode={isMaintenanceMode}
          gatedByDeposit={gatedByDeposit}
          progress={progress}
        />
      )}
    </main>
  );
}
