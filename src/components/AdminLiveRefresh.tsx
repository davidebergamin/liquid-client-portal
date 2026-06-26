"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

const TABLES = ["leads", "payments", "project_materials", "revision_requests", "maintenance_requests"];
const REFRESH_DEBOUNCE_MS = 1200;

export function AdminLiveRefresh() {
  const router = useRouter();
  const refreshTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) return;

    const scheduleRefresh = () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      refreshTimer.current = window.setTimeout(() => {
        refreshTimer.current = null;
        router.refresh();
      }, REFRESH_DEBOUNCE_MS);
    };

    const channel = supabase.channel("liquid-admin-live-refresh");
    TABLES.forEach((table) => {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        scheduleRefresh,
      );
    });
    channel.subscribe();
    return () => {
      if (refreshTimer.current) window.clearTimeout(refreshTimer.current);
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
