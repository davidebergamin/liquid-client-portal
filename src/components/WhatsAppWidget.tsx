import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

function whatsappHref() {
  const configuredUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL;
  if (configuredUrl) return configuredUrl;
  const phone = process.env.NEXT_PUBLIC_WHATSAPP_PHONE?.replace(/\D/g, "");
  const text = encodeURIComponent("Ciao Davide, ti scrivo dal portale Liquid.");
  if (phone) return `https://wa.me/${phone}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}

export function WhatsAppWidget() {
  return (
    <WhatsAppButton className="fixed bottom-4 right-4 z-50 px-4 py-3 text-sm shadow-xl shadow-emerald-900/20" />
  );
}

export function WhatsAppButton({
  className,
  labelClassName,
}: {
  className?: string;
  labelClassName?: string;
}) {
  return (
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-500 font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-emerald-600",
        className,
      )}
      aria-label="Contatta Liquid su WhatsApp"
    >
      <MessageCircle className="size-5" />
      <span className={cn("truncate", labelClassName)}>WhatsApp</span>
    </a>
  );
}
