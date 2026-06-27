import { Sparkles } from "lucide-react";
import { portalCopy } from "../copy";
import { PortalSurface } from "../shared/PortalSurface";

export function WaitingStep() {
  return (
    <div className="space-y-8">
      <PortalSurface variant="elevated" className="flex items-start gap-5">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[var(--liquid-indigo)]/10 text-[var(--liquid-indigo)]">
          <Sparkles className="size-7" strokeWidth={1.5} />
        </span>
        <div>
          <p className="text-lg font-medium leading-snug sm:text-xl">{portalCopy.waiting.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{portalCopy.waiting.body}</p>
        </div>
      </PortalSurface>
    </div>
  );
}
