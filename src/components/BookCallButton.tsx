import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const DEFAULT_BOOKING_URL = "https://cal.com/davidebergamin/meeting?duration=15";

export function bookingUrl(settings?: { booking_url?: string | null } | null) {
  return settings?.booking_url || DEFAULT_BOOKING_URL;
}

export function BookCallButton({
  url,
  variant = "outline",
  className,
}: {
  url?: string | null;
  variant?: React.ComponentProps<typeof Button>["variant"];
  className?: string;
}) {
  return (
    <Button asChild variant={variant} className={className}>
      <a href={url || DEFAULT_BOOKING_URL} target="_blank" rel="noreferrer">
        <CalendarDays className="size-4" /> Prenota 15 min
      </a>
    </Button>
  );
}
