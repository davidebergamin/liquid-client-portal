import { cn } from "@/lib/utils";

type Variant = "hero" | "action" | "success" | "info";

const variantClasses: Record<Variant, string> = {
  hero: "overflow-hidden rounded-[var(--portal-radius-surface)] border border-primary/10 bg-gradient-to-br from-primary/[0.03] via-background to-secondary/10",
  action: "rounded-[var(--portal-radius-surface)] border border-[var(--portal-border)] bg-background/80 p-6",
  success: "rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4",
  info: "rounded-[var(--portal-radius-surface)] border border-primary/10 bg-primary/[0.03] p-5",
};

const accentClasses = {
  coral: "liquid-step-card-coral",
  mint: "liquid-step-card-mint",
  lemon: "liquid-step-card-lemon",
  indigo: "liquid-step-card-indigo",
  gradient: "",
};

export function PortalStepCard({
  variant = "action",
  accent,
  className,
  children,
  showAccentLine,
}: {
  variant?: Variant;
  accent?: keyof typeof accentClasses;
  className?: string;
  children: React.ReactNode;
  showAccentLine?: boolean;
}) {
  return (
    <div
      className={cn(
        variantClasses[variant],
        variant === "action" && "portal-surface-elevated",
        accent && variant === "hero" && accentClasses[accent],
        className,
      )}
    >
      {showAccentLine && <div className="mb-4 h-0.5 w-12 rounded-full liquid-accent-line" />}
      {children}
    </div>
  );
}
