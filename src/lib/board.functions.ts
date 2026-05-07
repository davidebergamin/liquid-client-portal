import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "sites";

// Public: list all sites with like + comment counts
export const listSites = createServerFn({ method: "GET" }).handler(async () => {
  const { data: sites, error } = await supabaseAdmin
    .from("sites")
    .select("id,title,image_url,width,height,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const ids = (sites ?? []).map((s) => s.id);
  if (ids.length === 0) return { sites: [] as Array<typeof sites[number] & { likes: number; comments: number }> };

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabaseAdmin.from("likes").select("site_id").in("site_id", ids),
    supabaseAdmin.from("comments").select("site_id").in("site_id", ids),
  ]);

  const likeCounts = new Map<string, number>();
  (likes ?? []).forEach((l) => likeCounts.set(l.site_id, (likeCounts.get(l.site_id) ?? 0) + 1));
  const commentCounts = new Map<string, number>();
  (comments ?? []).forEach((c) => commentCounts.set(c.site_id, (commentCounts.get(c.site_id) ?? 0) + 1));

  return {
    sites: (sites ?? []).map((s) => ({
      ...s,
      likes: likeCounts.get(s.id) ?? 0,
      comments: commentCounts.get(s.id) ?? 0,
    })),
  };
});

// Public: get site detail with comments
export const getSite = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const [{ data: site }, { data: comments }, { data: likes }] = await Promise.all([
      supabaseAdmin.from("sites").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("comments")
        .select("id,author_name,body,created_at")
        .eq("site_id", data.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin.from("likes").select("visitor_id").eq("site_id", data.id),
    ]);
    if (!site) throw new Error("Sito non trovato");
    return { site, comments: comments ?? [], likes: (likes ?? []).map((l) => l.visitor_id) };
  });

// Public: toggle like for visitor
export const toggleLike = createServerFn({ method: "POST" })
  .inputValidator((d: { siteId: string; visitorId: string }) =>
    z.object({ siteId: z.string().uuid(), visitorId: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data }) => {
    const { data: existing } = await supabaseAdmin
      .from("likes")
      .select("id")
      .eq("site_id", data.siteId)
      .eq("visitor_id", data.visitorId)
      .maybeSingle();
    if (existing) {
      await supabaseAdmin.from("likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    await supabaseAdmin.from("likes").insert({ site_id: data.siteId, visitor_id: data.visitorId });
    return { liked: true };
  });

// Public: add comment
export const addComment = createServerFn({ method: "POST" })
  .inputValidator((d: { siteId: string; authorName: string; body: string }) =>
    z
      .object({
        siteId: z.string().uuid(),
        authorName: z.string().trim().min(1).max(60),
        body: z.string().trim().min(1).max(500),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const { data: row, error } = await supabaseAdmin
      .from("comments")
      .insert({ site_id: data.siteId, author_name: data.authorName, body: data.body })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { comment: row };
  });

function checkPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) throw new Error("Admin non configurato");
  if (password !== expected) throw new Error("Password errata");
}

// Admin: verify password (used by /admin login screen)
export const verifyAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string }) => z.object({ password: z.string().min(1).max(200) }).parse(d))
  .handler(async ({ data }) => {
    checkPassword(data.password);
    return { ok: true };
  });

// Admin: upload a single image (base64 data URL)
export const uploadSite = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; title?: string; fileName: string; dataUrl: string; width?: number; height?: number }) =>
    z
      .object({
        password: z.string().min(1).max(200),
        title: z.string().trim().max(120).optional(),
        fileName: z.string().min(1).max(200),
        dataUrl: z.string().min(20).max(20_000_000), // ~15MB base64
        width: z.number().int().positive().optional(),
        height: z.number().int().positive().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);

    const match = data.dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Formato immagine non valido");
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");

    const ext = (data.fileName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${ext || "jpg"}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    const { data: row, error } = await supabaseAdmin
      .from("sites")
      .insert({
        title: data.title || null,
        image_url: pub.publicUrl,
        width: data.width ?? null,
        height: data.height ?? null,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);

    return { site: row };
  });

// Admin: delete a site (and its image best-effort)
export const deleteSite = createServerFn({ method: "POST" })
  .inputValidator((d: { password: string; id: string }) =>
    z.object({ password: z.string().min(1).max(200), id: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data }) => {
    checkPassword(data.password);
    const { data: site } = await supabaseAdmin.from("sites").select("image_url").eq("id", data.id).maybeSingle();
    if (site?.image_url) {
      const path = site.image_url.split(`/${BUCKET}/`)[1];
      if (path) await supabaseAdmin.storage.from(BUCKET).remove([path]);
    }
    await supabaseAdmin.from("sites").delete().eq("id", data.id);
    return { ok: true };
  });
