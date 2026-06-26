import type { JourneyStep } from "../types";

export const stepAccentBg: Record<JourneyStep["accent"], string> = {
  coral: "portal-step-bg-coral",
  mint: "portal-step-bg-mint",
  lemon: "portal-step-bg-lemon",
  indigo: "portal-step-bg-indigo",
  gradient: "portal-step-bg-gradient",
};

export const stepRailAccent: Record<JourneyStep["accent"], string> = {
  coral: "portal-rail-accent-coral",
  mint: "portal-rail-accent-mint",
  lemon: "portal-rail-accent-lemon",
  indigo: "portal-rail-accent-indigo",
  gradient: "portal-rail-accent-gradient",
};

export const stepAccentText: Record<JourneyStep["accent"], string> = {
  coral: "text-orange-900/80",
  mint: "text-emerald-900/80",
  lemon: "text-yellow-900/80",
  indigo: "text-indigo-900/80",
  gradient: "text-primary",
};
