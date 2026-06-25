#!/usr/bin/env node
/**
 * Migrate Vision Board Studio (Lovable) → standalone Supabase (liquid client).
 *
 * Lovable project: Vision Board Studio
 * - project id: 9fbaf9d8-bdb4-4ea4-9aa7-bd52a76ad5f4
 * - slug: liquid-moodboard
 * - cloud db: phrlygefnjxmyhynbbgh
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const LOVABLE_PROJECT_ID = "9fbaf9d8-bdb4-4ea4-9aa7-bd52a76ad5f4";
const LOVABLE_PROJECT_NAME = "Vision Board Studio";
const OLD_URL = "https://phrlygefnjxmyhynbbgh.supabase.co";
const OLD_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBocmx5Z2Vmbmp4bXloeW5iYmdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxNjYxOTMsImV4cCI6MjA5Mzc0MjE5M30.EhSvxBo6gMpmxt76BUrq0nmbivswtRBwgFe__smI-2k";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

function loadEnv() {
  const envPath = resolve(root, ".env");
  if (!existsSync(envPath)) throw new Error("Missing .env in project root");
  const env = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const env = loadEnv();
const NEW_URL = env.SUPABASE_URL;
const NEW_SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
if (!NEW_URL || !NEW_SERVICE) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required in .env");

const oldDb = createClient(OLD_URL, OLD_ANON);
const newDb = createClient(NEW_URL, NEW_SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

function storagePathFromUrl(url) {
  if (!url) return null;
  const marker = "/storage/v1/object/public/sites/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length).split("?")[0]);
}

function rewriteStorageUrl(url) {
  if (!url) return url;
  const path = storagePathFromUrl(url);
  if (!path) return url;
  return newDb.storage.from("sites").getPublicUrl(path).data.publicUrl;
}

async function fetchTable(table, order) {
  const { data, error } = await oldDb.from(table).select("*").order(order.column, { ascending: order.asc ?? true });
  if (error) throw new Error(`${table}: ${error.message}`);
  return data ?? [];
}

async function copyStorageObject(path) {
  const publicUrl = `${OLD_URL}/storage/v1/object/public/sites/${encodeURI(path).replace(/%2F/g, "/")}`;
  const res = await fetch(publicUrl);
  if (!res.ok) throw new Error(`download failed ${path}: ${res.status}`);
  const body = new Uint8Array(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") || "application/octet-stream";
  const { error } = await newDb.storage.from("sites").upload(path, body, { upsert: true, contentType });
  if (error) throw new Error(`upload failed ${path}: ${error.message}`);
}

async function migrateStorageForSites(sites) {
  const paths = new Set();
  for (const site of sites) {
    for (const field of ["image_url", "full_image_url"]) {
      const path = storagePathFromUrl(site[field]);
      if (path) paths.add(path);
    }
  }
  let copied = 0;
  for (const path of paths) {
    process.stdout.write(`  storage ${++copied}/${paths.size}: ${path.slice(0, 60)}...\r`);
    await copyStorageObject(path);
  }
  process.stdout.write("\n");
  return paths.size;
}

async function clearTargetStorage() {
  const removeAll = async (prefix = "") => {
    const { data, error } = await newDb.storage.from("sites").list(prefix, { limit: 1000 });
    if (error) throw new Error(`storage list failed: ${error.message}`);
    if (!data?.length) return;
    const files = data.filter((item) => item.id).map((item) => (prefix ? `${prefix}/${item.name}` : item.name));
    const folders = data.filter((item) => !item.id).map((item) => (prefix ? `${prefix}/${item.name}` : item.name));
    if (files.length) {
      const { error: removeError } = await newDb.storage.from("sites").remove(files);
      if (removeError) throw new Error(`storage remove failed: ${removeError.message}`);
    }
    for (const folder of folders) await removeAll(folder);
  };
  await removeAll();
}

async function clearTargetTables() {
  const tables = [
    "request_attachments",
    "comments",
    "likes",
    "lead_sites",
    "project_materials",
    "revision_requests",
    "maintenance_requests",
    "payments",
    "project_checklist_items",
    "invoice_profiles",
    "briefs",
    "sites",
    "leads",
  ];
  for (const table of tables) {
    const { error: delError } = await newDb.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (delError && !/Could not find|permission denied/i.test(delError.message)) {
      console.warn(`  clear ${table}: ${delError.message}`);
    }
  }
}

async function upsertRows(table, rows) {
  if (!rows.length) return 0;
  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await newDb.from(table).upsert(chunk, { onConflict: "id" });
    if (error) throw new Error(`${table} upsert: ${error.message}`);
  }
  return rows.length;
}

async function main() {
  console.log(`Migrating Lovable project "${LOVABLE_PROJECT_NAME}" (${LOVABLE_PROJECT_ID})`);
  console.log(`Source cloud db: ${OLD_URL}`);
  console.log(`Target: ${NEW_URL}\n`);

  const [sitesRaw, leads, likes, comments] = await Promise.all([
    fetchTable("sites", { column: "sort_order" }),
    fetchTable("leads", { column: "created_at" }),
    fetchTable("likes", { column: "created_at" }),
    fetchTable("comments", { column: "created_at" }),
  ]);

  console.log(`Found: ${sitesRaw.length} sites, ${leads.length} leads, ${likes.length} likes, ${comments.length} comments`);

  console.log("Clearing target tables and storage...");
  await clearTargetTables();
  await clearTargetStorage();

  console.log("Copying storage objects...");
  const storageCount = await migrateStorageForSites(sitesRaw);

  const sites = sitesRaw.map((site) => ({
    ...site,
    image_url: rewriteStorageUrl(site.image_url),
    full_image_url: site.full_image_url ? rewriteStorageUrl(site.full_image_url) : site.full_image_url,
  }));

  console.log("Importing rows...");
  await upsertRows("sites", sites);
  await upsertRows("leads", leads);
  await upsertRows("likes", likes);
  await upsertRows("comments", comments);

  console.log("\nMigration complete.");
  console.log(`  Storage files copied: ${storageCount}`);
  console.log(`  Sites: ${sites.length}, Leads: ${leads.length}, Likes: ${likes.length}, Comments: ${comments.length}`);
}

main().catch((err) => {
  console.error("\nMigration failed:", err.message);
  process.exit(1);
});
