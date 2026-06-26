import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export function PortalPrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "group liquid-cta-gradient portal-cta-glow rounded-full border-0 text-white transition-all duration-300 hover:-translate-y-0.5 hover:brightness-105",
        className,
      )}
      {...props}
    />
  );
}
