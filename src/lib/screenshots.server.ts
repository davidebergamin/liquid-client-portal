import { supabaseAdmin } from "@/integrations/supabase/client.server";

const BUCKET = "sites";

// WordPress mShots: free, no key, returns a generic ~2KB loading image while
// the screenshot is being generated, then the real image afterwards.
function mshotsUrl(target: string, w: number, h: number) {
  return `https://s.wordpress.com/mshots/v1/${encodeURIComponent(target)}?w=${w}&h=${h}`;
}

async function fetchScreenshotBytes(url: string, w: number, h: number): Promise<Uint8Array | null> {
  // Poll up to ~45s for mshots to finish generating the real image.
  for (let i = 0; i < 8; i++) {
    try {
      const res = await fetch(mshotsUrl(url, w, h), {
        headers: { Accept: "image/*" },
        signal: AbortSignal.timeout(15_000),
        redirect: "follow",
      });
      if (!res.ok) {
        await new Promise((r) => setTimeout(r, 4000));
        continue;
      }
      const buf = new Uint8Array(await res.arrayBuffer());
      // mshots loading placeholder is small (<6KB). Real captures are typically 30KB+.
      if (buf.byteLength > 8000) return buf;
      await new Promise((r) => setTimeout(r, 4000));
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  return null;
}

async function uploadBytes(bytes: Uint8Array, prefix: string) {
  const path = `${prefix}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: "image/jpeg", upsert: false });
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
    const [hero, full] = await Promise.all([
      fetchScreenshotBytes(url, 1600, 1000),
      fetchScreenshotBytes(url, 1400, 4000),
    ]);

    if (!hero && !full) {
      await supabaseAdmin.from(table).update({ screenshot_status: "failed" }).eq("id", id);
      return { ok: false };
    }

    const [heroUrl, fullUrl] = await Promise.all([
      hero ? uploadBytes(hero, `screens/hero`) : Promise.resolve(null as string | null),
      full ? uploadBytes(full, `screens/full`) : Promise.resolve(null as string | null),
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
      patch.width = 1600;
      patch.height = 1000;
    }
    if (fullUrl) patch.full_image_url = fullUrl;

    await supabaseAdmin.from(table).update(patch).eq("id", id);

    return { ok: true };
  } catch (e) {
    await supabaseAdmin.from(table).update({ screenshot_status: "failed" }).eq("id", id);
    return { ok: false, error: (e as Error).message };
  }
}
