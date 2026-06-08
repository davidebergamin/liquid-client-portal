import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { captureAndStore } from "@/lib/screenshots.server";

export const Route = createFileRoute("/api/public/capture/$kind/$id")({
  server: {
    handlers: {
      POST: async ({ params }) => {
        const kind = params.kind === "lead_sites" ? "lead_sites" : "sites";
        const id = params.id;
        if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response("bad id", { status: 400 });

        const { data: row } = await supabaseAdmin
          .from(kind)
          .select("id,link_url,screenshot_status")
          .eq("id", id)
          .maybeSingle();
        if (!row?.link_url) return new Response("no link", { status: 404 });

        const result = await captureAndStore({ table: kind, id, url: row.link_url });
        return Response.json(result);
      },
    },
  },
});
