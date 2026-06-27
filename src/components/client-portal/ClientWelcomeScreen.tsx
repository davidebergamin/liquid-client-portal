"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Palette, Rocket, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { portalCopy } from "./copy";
import { PortalPrimaryButton } from "./shared/PortalPrimaryButton";
import type { PortalActions } from "./types";

const iconMap = {
  rocket: Rocket,
  palette: Palette,
  sparkles: Sparkles,
} as const;

const accentSurface: Record<string, string> = {
  coral: "bg-[var(--liquid-coral)]/8 border-[var(--liquid-coral)]/15",
  mint: "bg-[var(--liquid-mint)]/10 border-[var(--liquid-mint)]/15",
  indigo: "bg-[var(--liquid-indigo)]/8 border-[var(--liquid-indigo)]/15",
};

export function ClientWelcomeScreen({
  slug,
  clientName,
  markWelcomeSeen,
}: {
  slug: string;
  clientName: string;
  markWelcomeSeen: PortalActions["markPortalWelcomeSeen"];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStart() {
    startTransition(async () => {
      const fd = new FormData();
      fd.set("slug", slug);
      await markWelcomeSeen(fd);
      router.refresh();
    });
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center px-4 py-16 md:px-8 lg:px-12">
      <div
        className="portal-liquid-orb size-[420px] -left-32 -top-32 bg-[var(--liquid-coral)]"
        aria-hidden
      />
      <div
        className="portal-liquid-orb size-[360px] -right-24 top-1/4 bg-[var(--liquid-mint)]"
        style={{ animationDelay: "-8s" }}
        aria-hidden
      />
      <div
        className="portal-liquid-orb size-[300px] bottom-0 left-1/3 bg-[var(--liquid-indigo)]"
        style={{ animationDelay: "-16s" }}
        aria-hidden
      />

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="portal-enter portal-stagger-1 mb-8 flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-[var(--liquid-coral)]" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-foreground/60">
            LIQUID
          </span>
        </div>

        <h1 className="portal-enter portal-stagger-1 font-display text-5xl leading-[1.05] tracking-tight sm:text-7xl lg:text-8xl">
          {portalCopy.welcome.greeting(clientName)}
        </h1>
        <p className="portal-enter portal-stagger-2 mt-4 text-xl font-medium text-foreground/90 sm:text-2xl">
          {portalCopy.welcome.subtitle}
        </p>
        <p className="portal-enter portal-stagger-2 mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          {portalCopy.welcome.body}
        </p>

        <div className="portal-enter portal-stagger-3 mt-12 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {portalCopy.welcome.overview.map((item) => {
            const Icon = iconMap[item.icon];
            return (
              <div
                key={item.title}
                className={cn(
                  "portal-hover-lift rounded-[var(--portal-radius-surface)] border p-6 sm:p-7",
                  accentSurface[item.accent],
                )}
              >
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-background/60 text-foreground/80">
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 font-display text-2xl leading-tight">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            );
          })}
        </div>

        <div className="portal-enter portal-stagger-4 mt-12 flex flex-col items-start gap-3">
          <PortalPrimaryButton
            size="lg"
            disabled={isPending}
            onClick={handleStart}
            className="min-h-12 gap-3 rounded-full px-6 text-base font-semibold sm:min-h-14 sm:px-10"
          >
            {isPending ? "Un attimo…" : portalCopy.welcome.cta}
            <ArrowRight className="size-5 transition-transform group-hover:translate-x-0.5" />
          </PortalPrimaryButton>
          <p className="text-sm text-muted-foreground">{portalCopy.welcome.footnote}</p>
        </div>
      </div>
    </div>
  );
}
