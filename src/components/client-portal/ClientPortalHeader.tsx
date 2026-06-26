import { BookCallButton } from "@/components/BookCallButton";

export function ClientPortalHeader({
  clientName,
  booking,
}: {
  clientName: string;
  booking: string;
}) {
  return (
    <header className="portal-header-glass sticky top-0 z-30 px-4 py-3 md:px-8 lg:px-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex shrink-0 items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-[var(--liquid-coral)]" />
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/80">
              LIQUID
            </span>
          </span>
          <span className="text-muted-foreground/30">·</span>
          <span className="truncate text-sm font-medium text-foreground/90">{clientName}</span>
        </div>
        <BookCallButton url={booking} variant="ghost" className="h-8 shrink-0 px-3 text-xs text-muted-foreground hover:text-foreground" />
      </div>
    </header>
  );
}
