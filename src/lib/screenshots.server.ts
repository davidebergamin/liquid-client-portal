import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "sites";

type Screenshot = {
  bytes: Uint8Array;
  contentType: string;
  width: number;
  height: number;
};

async function fetchImage(url: string): Promise<{ bytes: Uint8Array; contentType: string } | null> {
  const res = await fetch(url, {
    headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/*" },
    signal: AbortSignal.timeout(25_000),
    redirect: "follow",
  });
  if (!res.ok) return null;
  const contentType = res.headers.get("content-type")?.split(";")[0] || "image/png";
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (!contentType.startsWith("image/") || bytes.byteLength < 30_000) return null;
  return { bytes, contentType };
}

async function fetchMicrolinkScreenshot(url: string, width: number, height: number): Promise<Screenshot | null> {
  const api = new URL("https://api.microlink.io/");
  api.searchParams.set("url", url);
  api.searchParams.set("screenshot", "true");
  api.searchParams.set("meta", "false");
  api.searchParams.set("viewport.width", String(width));
  api.searchParams.set("viewport.height", String(height));
  api.searchParams.set("deviceScaleFactor", "1");

  const res = await fetch(api, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(40_000),
    redirect: "follow",
  });
  if (!res.ok) return null;

  const json = await res.json().catch(() => null) as {
    status?: string;
    data?: { screenshot?: { url?: string; width?: number; height?: number } };
  } | null;
  const screenshot = json?.data?.screenshot;
  if (json?.status !== "success" || !screenshot?.url) return null;

  const image = await fetchImage(screenshot.url);
  if (!image) return null;
  return {
    ...image,
    width: screenshot.width || width,
    height: screenshot.height || height,
  };
}

async function fetchThumScreenshot(url: string, width: number, height: number): Promise<Screenshot | null> {
  const mode = height > 1800 ? "fullpage" : `crop/${height}`;
  const image = await fetchImage(`https://image.thum.io/get/width/${width}/${mode}/${url}`);
  return image ? { ...image, width, height } : null;
}

async function fetchScreenshot(url: string, width: number, height: number): Promise<Screenshot | null> {
  return (await fetchMicrolinkScreenshot(url, width, height)) ?? fetchThumScreenshot(url, width, height);
}

async function uploadScreenshot(screenshot: Screenshot, prefix: string) {
  const ext = screenshot.contentType.includes("jpeg") || screenshot.contentType.includes("jpg") ? "jpg" : "png";
  const path = `${prefix}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, screenshot.bytes, { contentType: screenshot.contentType, upsert: false });
  if (error) throw new Error(error.message);
  return supabaseAdmin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function captureAndStore(opts: {
  table: "sites" | "lead_sites";
  id: string;
  url: string;
}) {
  const { table, id, url } = opts;
  try {
    await supabaseAdmin.from(table).update({ screenshot_status: "pending" }).eq("id", id);

    const [hero, full] = await Promise.all([
      fetchScreenshot(url, 1600, 1000),
      fetchScreenshot(url, 1400, 4000),
    ]);

    if (!hero && !full) {
      await supabaseAdmin.from(table).update({ screenshot_status: "failed" }).eq("id", id);
      return { ok: false };
    }

    const [heroUrl, fullUrl] = await Promise.all([
      hero ? uploadScreenshot(hero, `screens/hero`) : Promise.resolve(null as string | null),
      full ? uploadScreenshot(full, `screens/full`) : Promise.resolve(null as string | null),
    ]);

    const patch: {
      screenshot_status: string;
      image_url?: string;
      width?: number;
      height?: number;
      full_image_url?: string;
    } = { screenshot_status: "ready" };
    if (heroUrl) {
      patch.image_url = heroUrl;
      patch.width = hero?.width ?? 1600;
      patch.height = hero?.height ?? 1000;
    }
    if (fullUrl) patch.full_image_url = fullUrl;

    await supabaseAdmin.from(table).update(patch).eq("id", id);

    return { ok: true };
  } catch (e) {
    await supabaseAdmin.from(table).update({ screenshot_status: "failed" }).eq("id", id);
    return { ok: false, error: (e as Error).message };
  }
}
