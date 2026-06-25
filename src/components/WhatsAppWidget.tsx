import { MessageCircle } from "lucide-react";

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
    <a
      href={whatsappHref()}
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-xl shadow-emerald-900/20 transition-all hover:-translate-y-0.5 hover:bg-emerald-600"
      aria-label="Contatta Liquid su WhatsApp"
    >
      <MessageCircle className="size-5" />
      <span className="hidden sm:inline">WhatsApp</span>
    </a>
  );
}
