import { cn } from "@/lib/utils";

type Variant = "flat" | "elevated" | "inset" | "hero";

const variantClasses: Record<Variant, string> = {
  flat: "rounded-2xl p-6",
  elevated: "portal-surface-elevated p-6 portal-hover-lift",
  inset: "portal-surface-inset p-5",
  hero: "overflow-hidden rounded-2xl border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-background to-secondary/10 p-6 sm:p-8",
};

export function PortalSurface({
  variant = "flat",
  className,
  children,
  showAccentLine,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
  showAccentLine?: boolean;
}) {
  return (
    <div className={cn(variantClasses[variant], className)}>
      {showAccentLine && <div className="mb-4 h-0.5 w-12 rounded-full liquid-accent-line" />}
      {children}
    </div>
  );
}
