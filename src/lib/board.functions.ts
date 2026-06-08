import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "sites";

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const rand = Math.random().toString(36).slice(2, 6);
  return `${base || "lead"}-${rand}`;
}

// ---------- PUBLIC (lead-scoped) ----------

async function getLeadBySlug(slug: string) {
  const { data } = await supabaseAdmin.from("leads").select("id,name,slug").eq("slug", slug).maybeSingle();
  if (!data) throw new Error("Link non valido");
  return data;
}

export const getBoard = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);

    const { data: sites, error } = await supabaseAdmin
      .from("sites")
      .select("id,title,image_url,full_image_url,screenshot_status,link_url,width,height,sort_order,created_at")
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);


    const ids = (sites ?? []).map((s) => s.id);

    const [likesRes, commentsRes, leadSitesRes] = await Promise.all([
      ids.length
        ? supabaseAdmin.from("likes").select("site_id").eq("lead_id", lead.id).in("site_id", ids)
        : Promise.resolve({ data: [] as { site_id: string | null }[] }),
      ids.length
        ? supabaseAdmin.from("comments").select("site_id").eq("lead_id", lead.id).in("site_id", ids)
        : Promise.resolve({ data: [] as { site_id: string | null }[] }),
      supabaseAdmin
        .from("lead_sites")
        .select("id,title,image_url,full_image_url,screenshot_status,link_url,width,height,created_at")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false }),
    ]);


    const likedSet = new Set((likesRes.data ?? []).map((l) => l.site_id));
    const commentCounts = new Map<string, number>();
    (commentsRes.data ?? []).forEach((c) => { if (c.site_id) commentCounts.set(c.site_id, (commentCounts.get(c.site_id) ?? 0) + 1); });

    return {
      lead,
      sites: (sites ?? []).map((s) => ({
        ...s,
        liked: likedSet.has(s.id),
        likes: likedSet.has(s.id) ? 1 : 0,
        comments: commentCounts.get(s.id) ?? 0,
      })),
      leadSites: leadSitesRes.data ?? [],
    };
  });

export const getSiteForLead = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string; id: string }) =>
    z.object({ slug: z.string().min(1).max(80), id: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);
    const [{ data: site }, { data: comments }, { data: like }] = await Promise.all([
      supabaseAdmin.from("sites").select("*").eq("id", data.id).maybeSingle(),
      supabaseAdmin
        .from("comments")
        .select("id,body,created_at")
        .eq("site_id", data.id)
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("likes")
        .select("id")
        .eq("site_id", data.id)
        .eq("lead_id", lead.id)
        .maybeSingle(),
    ]);
    if (!site) throw new Error("Sito non trovato");
    return { lead, site, comments: comments ?? [], liked: !!like };
  });

export const toggleLike = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; siteId: string }) =>
    z.object({ slug: z.string().min(1).max(80), siteId: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);
    const { data: existing } = await supabaseAdmin
      .from("likes")
      .select("id")
      .eq("site_id", data.siteId)
      .eq("lead_id", lead.id)
      .maybeSingle();
    if (existing) {
      await supabaseAdmin.from("likes").delete().eq("id", existing.id);
      return { liked: false };
    }
    await supabaseAdmin.from("likes").insert({ site_id: data.siteId, lead_id: lead.id });
    return { liked: true };
  });

export const addComment = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; siteId: string; body: string }) =>
    z
      .object({
        slug: z.string().min(1).max(80),
        siteId: z.string().uuid(),
        body: z.string().trim().min(1).max(500),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);
    const { data: row, error } = await supabaseAdmin
      .from("comments")
      .insert({ site_id: data.siteId, lead_id: lead.id, author_name: lead.name, body: data.body })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { comment: row };
  });

export const deleteOwnComment = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; id: string }) =>
    z.object({ slug: z.string().min(1).max(80), id: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);
    await supabaseAdmin.from("comments").delete().eq("id", data.id).eq("lead_id", lead.id);
    return { ok: true };
  });

// ---------- ADMIN (no auth — site is private by obscurity of lead links) ----------

export const adminListSites = createServerFn({ method: "GET" }).handler(async () => {
  const { data: sites } = await supabaseAdmin
    .from("sites")
    .select("id,title,image_url,link_url,width,height,sort_order,created_at")
    .order("sort_order", { ascending: true });

  const ids = (sites ?? []).map((s) => s.id);
  if (ids.length === 0) return { sites: [] };

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabaseAdmin.from("likes").select("site_id").in("site_id", ids),
    supabaseAdmin.from("comments").select("site_id").in("site_id", ids),
  ]);
  const likeCounts = new Map<string, number>();
  (likes ?? []).forEach((l) => likeCounts.set(l.site_id, (likeCounts.get(l.site_id) ?? 0) + 1));
  const commentCounts = new Map<string, number>();
  (comments ?? []).forEach((c) => { if (c.site_id) commentCounts.set(c.site_id, (commentCounts.get(c.site_id) ?? 0) + 1); });

  return {
    sites: (sites ?? []).map((s) => ({
      ...s,
      likes: likeCounts.get(s.id) ?? 0,
      comments: commentCounts.get(s.id) ?? 0,
    })),
  };
});

export const uploadSite = createServerFn({ method: "POST" })
  .inputValidator(
    (d: { title?: string; fileName?: string; dataUrl?: string; width?: number; height?: number; linkUrl?: string }) =>
      z
        .object({
          title: z.string().trim().max(120).optional(),
          fileName: z.string().min(1).max(200).optional(),
          dataUrl: z.string().min(20).max(20_000_000).optional(),
          width: z.number().int().positive().optional(),
          height: z.number().int().positive().optional(),
          linkUrl: z.string().url().max(500).optional(),
        })
        .parse(d)
  )
  .handler(async ({ data }) => {
    if (!data.dataUrl) throw new Error("Immagine richiesta");
    const match = data.dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Formato immagine non valido");
    const contentType = match[1];
    const buffer = Buffer.from(match[2], "base64");

    const fileName = data.fileName || "image.jpg";
    const ext = (fileName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${crypto.randomUUID()}.${ext || "jpg"}`;

    const { error: upErr } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType, upsert: false });
    if (upErr) throw new Error(upErr.message);

    const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);

    const { data: minRow } = await supabaseAdmin
      .from("sites")
      .select("sort_order")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    const nextOrder = (minRow?.sort_order ?? 1) - 1;

    const { data: row, error } = await supabaseAdmin
      .from("sites")
      .insert({
        title: data.title || null,
        image_url: pub.publicUrl,
        link_url: data.linkUrl || null,
        width: data.width ?? null,
        height: data.height ?? null,
        sort_order: nextOrder,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { site: row };
  });

async function fetchSitePreview(url: string): Promise<{ title: string | null; image: string | null }> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; LiquidBot/1.0)" },
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok || !res.body) return { title: null, image: null };

    // Stream and cap at ~200KB to avoid blowing the worker memory limit on large pages.
    const MAX_BYTES = 200_000;
    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: false });
    let html = "";
    let received = 0;
    try {
      while (received < MAX_BYTES) {
        const { done, value } = await reader.read();
        if (done) break;
        received += value.byteLength;
        html += decoder.decode(value, { stream: true });
      }
    } finally {
      try { await reader.cancel(); } catch { /* ignore */ }
    }

    const meta = (prop: string) => {
      const re = new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)["']`, "i");
      const m = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i"));
      return m?.[1] ?? null;
    };
    let image = meta("og:image") || meta("twitter:image") || meta("og:image:url");
    const title = meta("og:title") || meta("twitter:title") || (html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] ?? null);
    if (image && image.startsWith("//")) image = "https:" + image;
    if (image && image.startsWith("/")) {
      const u = new URL(url);
      image = `${u.origin}${image}`;
    }
    return { title: title?.trim().slice(0, 120) || null, image: image || null };
  } catch {
    return { title: null, image: null };
  }
}

export const addSiteLink = createServerFn({ method: "POST" })
  .inputValidator((d: { url: string }) =>
    z.object({ url: z.string().trim().min(1).max(500) }).parse(d)
  )
  .handler(async ({ data }) => {
    let url = data.url.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    try { new URL(url); } catch { throw new Error("URL non valido"); }

    const preview = await fetchSitePreview(url);
    const host = new URL(url).hostname.replace(/^www\./, "");
    const fallback = `https://www.google.com/s2/favicons?domain=${host}&sz=256`;

    const { data: minRow } = await supabaseAdmin
      .from("sites")
      .select("sort_order")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    const nextOrder = (minRow?.sort_order ?? 1) - 1;

    const { data: row, error } = await supabaseAdmin
      .from("sites")
      .insert({
        title: preview.title || host,
        image_url: preview.image || fallback,
        link_url: url,
        sort_order: nextOrder,
        screenshot_status: "pending",
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { site: row };
  });


export const updateSite = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; title?: string | null; linkUrl?: string | null }) =>
    z.object({
      id: z.string().uuid(),
      title: z.string().trim().max(120).nullable().optional(),
      linkUrl: z.string().trim().max(500).nullable().optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const patch: { title?: string | null; link_url?: string | null } = {};
    if (data.title !== undefined) patch.title = data.title || null;
    if (data.linkUrl !== undefined) patch.link_url = data.linkUrl || null;
    const { error } = await supabaseAdmin.from("sites").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const reorderSites = createServerFn({ method: "POST" })
  .inputValidator((d: { ids: string[] }) =>
    z.object({ ids: z.array(z.string().uuid()).min(1).max(1000) }).parse(d)
  )
  .handler(async ({ data }) => {
    await Promise.all(
      data.ids.map((id, i) =>
        supabaseAdmin.from("sites").update({ sort_order: i + 1 }).eq("id", id)
      )
    );
    return { ok: true };
  });

export const deleteSite = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: site } = await supabaseAdmin.from("sites").select("image_url").eq("id", data.id).maybeSingle();
    if (site?.image_url) {
      const path = site.image_url.split(`/${BUCKET}/`)[1];
      if (path) await supabaseAdmin.storage.from(BUCKET).remove([path]);
    }
    await supabaseAdmin.from("sites").delete().eq("id", data.id);
    return { ok: true };
  });

// Leads management
export const createLead = createServerFn({ method: "POST" })
  .inputValidator((d: { name: string; companyName?: string }) =>
    z
      .object({
        name: z.string().trim().min(1).max(80),
        companyName: z.string().trim().max(120).optional(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    let slug = slugify(data.name);
    for (let i = 0; i < 4; i++) {
      const { data: exists } = await supabaseAdmin.from("leads").select("id").eq("slug", slug).maybeSingle();
      if (!exists) break;
      slug = slugify(data.name);
    }
    const { data: row, error } = await supabaseAdmin
      .from("leads")
      .insert({ name: data.name, slug, company_name: data.companyName || null })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { lead: row };
  });

export const updateLead = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string; name?: string; companyName?: string | null }) =>
    z
      .object({
        id: z.string().uuid(),
        name: z.string().trim().min(1).max(80).optional(),
        companyName: z.string().trim().max(120).nullable().optional(),
      })
      .parse(d)
  )
  .handler(async ({ data }) => {
    const patch: { name?: string; company_name?: string | null } = {};
    if (data.name !== undefined) patch.name = data.name;
    if (data.companyName !== undefined) patch.company_name = data.companyName || null;
    const { error } = await supabaseAdmin.from("leads").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listLeads = createServerFn({ method: "GET" }).handler(async () => {
  const { data: leads } = await supabaseAdmin
    .from("leads")
    .select("id,name,slug,company_name,created_at")
    .order("created_at", { ascending: false });

  const ids = (leads ?? []).map((l) => l.id);
  if (ids.length === 0) return { leads: [] };

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabaseAdmin.from("likes").select("lead_id").in("lead_id", ids),
    supabaseAdmin.from("comments").select("lead_id").in("lead_id", ids),
  ]);
  const lc = new Map<string, number>();
  (likes ?? []).forEach((l) => l.lead_id && lc.set(l.lead_id, (lc.get(l.lead_id) ?? 0) + 1));
  const cc = new Map<string, number>();
  (comments ?? []).forEach((c) => c.lead_id && cc.set(c.lead_id, (cc.get(c.lead_id) ?? 0) + 1));

  return {
    leads: (leads ?? []).map((l) => ({
      ...l,
      likes: lc.get(l.id) ?? 0,
      comments: cc.get(l.id) ?? 0,
    })),
  };
});

export const deleteLead = createServerFn({ method: "POST" })
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    await supabaseAdmin.from("leads").delete().eq("id", data.id);
    return { ok: true };
  });

export const getLeadDetail = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const { data: lead } = await supabaseAdmin
      .from("leads")
      .select("id,name,slug,company_name,created_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!lead) throw new Error("Lead non trovato");

    const { data: sites } = await supabaseAdmin
      .from("sites")
      .select("id,title,image_url,sort_order")
      .order("sort_order", { ascending: true });

    const ids = (sites ?? []).map((s) => s.id);
    const [{ data: likes }, { data: comments }] =
      ids.length === 0
        ? [{ data: [] as { site_id: string }[] }, { data: [] as { site_id: string; body: string; created_at: string; id: string }[] }]
        : await Promise.all([
            supabaseAdmin.from("likes").select("site_id").eq("lead_id", lead.id).in("site_id", ids),
            supabaseAdmin
              .from("comments")
              .select("id,site_id,body,created_at")
              .eq("lead_id", lead.id)
              .in("site_id", ids)
              .order("created_at", { ascending: false }),
          ]);

    const likedSet = new Set((likes ?? []).map((l) => l.site_id));
    const cMap = new Map<string, { id: string; body: string; created_at: string }[]>();
    (comments ?? []).forEach((c) => {
      if (!c.site_id) return;
      const list = cMap.get(c.site_id) ?? [];
      list.push({ id: c.id, body: c.body, created_at: c.created_at });
      cMap.set(c.site_id, list);
    });

    return {
      lead,
      sites: (sites ?? []).map((s) => ({
        ...s,
        liked: likedSet.has(s.id),
        comments: cMap.get(s.id) ?? [],
      })),
    };
  });

// ---------- LEAD UPLOADS (lead-submitted images/links) ----------

export const addLeadSite = createServerFn({ method: "POST" })
  .inputValidator((d: {
    slug: string;
    title?: string;
    fileName?: string;
    dataUrl?: string;
    width?: number;
    height?: number;
    linkUrl?: string;
  }) =>
    z.object({
      slug: z.string().min(1).max(80),
      title: z.string().trim().max(120).optional(),
      fileName: z.string().min(1).max(200).optional(),
      dataUrl: z.string().min(20).max(20_000_000).optional(),
      width: z.number().int().positive().optional(),
      height: z.number().int().positive().optional(),
      linkUrl: z.string().url().max(500).optional(),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);
    let imageUrl: string | null = null;
    let width = data.width ?? null;
    let height = data.height ?? null;

    if (data.dataUrl) {
      const match = data.dataUrl.match(/^data:(.+);base64,(.+)$/);
      if (!match) throw new Error("Formato immagine non valido");
      const contentType = match[1];
      const buffer = Buffer.from(match[2], "base64");
      const fileName = data.fileName || "image.jpg";
      const ext = (fileName.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `lead-${lead.id}/${crypto.randomUUID()}.${ext || "jpg"}`;
      const { error: upErr } = await supabaseAdmin.storage
        .from(BUCKET).upload(path, buffer, { contentType, upsert: false });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path);
      imageUrl = pub.publicUrl;
    }

    if (!imageUrl && !data.linkUrl) throw new Error("Carica un'immagine o inserisci un link");

    const { data: row, error } = await supabaseAdmin
      .from("lead_sites")
      .insert({
        lead_id: lead.id,
        title: data.title || null,
        image_url: imageUrl,
        link_url: data.linkUrl || null,
        width,
        height,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { leadSite: row };
  });

export const deleteLeadSite = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; id: string }) =>
    z.object({ slug: z.string().min(1).max(80), id: z.string().uuid() }).parse(d)
  )
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);
    const { data: row } = await supabaseAdmin
      .from("lead_sites").select("image_url").eq("id", data.id).eq("lead_id", lead.id).maybeSingle();
    if (row?.image_url) {
      const path = row.image_url.split(`/${BUCKET}/`)[1];
      if (path) await supabaseAdmin.storage.from(BUCKET).remove([path]);
    }
    await supabaseAdmin.from("lead_sites").delete().eq("id", data.id).eq("lead_id", lead.id);
    return { ok: true };
  });

export const addLeadSiteComment = createServerFn({ method: "POST" })
  .inputValidator((d: { slug: string; leadSiteId: string; body: string }) =>
    z.object({
      slug: z.string().min(1).max(80),
      leadSiteId: z.string().uuid(),
      body: z.string().trim().min(1).max(500),
    }).parse(d)
  )
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);
    const { data: row, error } = await supabaseAdmin
      .from("comments")
      .insert({ lead_site_id: data.leadSiteId, lead_id: lead.id, author_name: lead.name, body: data.body })
      .select().single();
    if (error) throw new Error(error.message);
    return { comment: row };
  });

// Extended lead detail with their uploaded sites + comments
export const getLeadUploads = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1).max(80) }).parse(d))
  .handler(async ({ data }) => {
    const lead = await getLeadBySlug(data.slug);
    const { data: leadSites } = await supabaseAdmin
      .from("lead_sites")
      .select("id,title,image_url,link_url,created_at")
      .eq("lead_id", lead.id)
      .order("created_at", { ascending: false });

    const ids = (leadSites ?? []).map((s) => s.id);
    const { data: comments } = ids.length
      ? await supabaseAdmin
          .from("comments")
          .select("id,lead_site_id,body,created_at")
          .eq("lead_id", lead.id)
          .in("lead_site_id", ids)
          .order("created_at", { ascending: false })
      : { data: [] as { id: string; lead_site_id: string | null; body: string; created_at: string }[] };

    const cMap = new Map<string, { id: string; body: string; created_at: string }[]>();
    (comments ?? []).forEach((c) => {
      if (!c.lead_site_id) return;
      const list = cMap.get(c.lead_site_id) ?? [];
      list.push({ id: c.id, body: c.body, created_at: c.created_at });
      cMap.set(c.lead_site_id, list);
    });

    return {
      leadSites: (leadSites ?? []).map((s) => ({ ...s, comments: cMap.get(s.id) ?? [] })),
    };
  });
