import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

export function PortalPrimaryButton({ className, ...props }: ButtonProps) {
  return (
    <Button
      className={cn(
        "group liquid-cta-gradient h-auto min-h-11 max-w-full whitespace-normal rounded-full border-0 px-5 py-3 text-center leading-tight text-white shadow-[0_14px_34px_var(--liquid-action-shadow)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_42px_var(--liquid-action-shadow)] sm:whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}
