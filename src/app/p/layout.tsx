import { WhatsAppWidget } from "@/components/WhatsAppWidget";

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WhatsAppWidget />
    </>
  );
}
