import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

const requiredFiles = [
  "src/app/admin/page.tsx",
  "src/app/admin/login/page.tsx",
  "src/app/admin/projects/[id]/page.tsx",
  "src/app/p/[slug]/page.tsx",
  "src/app/b/[slug]/page.tsx",
  "src/lib/portal.ts",
  "supabase/migrations/20260625100000_liquid_client_portal_mvp.sql",
];

const requiredEnv = [
  "SUPABASE_URL",
  "SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const recommendedEnv = [
  "LIQUID_ADMIN_PASSWORD",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
];

function readDotEnv() {
  const path = join(root, ".env");
  if (!existsSync(path)) return {};
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [line.slice(0, index), line.slice(index + 1).replace(/^['"]|['"]$/g, "")];
      }),
  );
}

const env = { ...readDotEnv(), ...process.env };
const missingFiles = requiredFiles.filter((file) => !existsSync(join(root, file)));
const missingEnv = requiredEnv.filter((key) => !env[key]);
const missingRecommendedEnv = recommendedEnv.filter((key) => !env[key]);
const smokeUrlArg = process.argv.find((arg) => arg.startsWith("--smoke-url="));
const smokeUrl = smokeUrlArg?.slice("--smoke-url=".length);
const smokeOnly = process.argv.includes("--smoke-only");
const dbCheck = process.argv.includes("--db-check");

const requiredTables = [
  ["leads", "id,name,slug,status,next_action,draft_url,published_url,maintenance_active"],
  ["project_checklist_items", "id"],
  ["invoice_profiles", "id"],
  ["payments", "id"],
  ["briefs", "id"],
  ["project_materials", "id"],
  ["revision_requests", "id"],
  ["maintenance_requests", "id"],
  ["portal_settings", "id"],
  ["site_references", "id,title,image_url"],
];

function parseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function validateSupabaseUrl(key) {
  if (!env[key]) return null;
  const parsed = parseUrl(env[key]);
  if (!parsed) return `${key} is not a valid URL`;
  if (parsed.hostname === "supabase.com" || parsed.hostname.endsWith(".supabase.com")) {
    return `${key} points to Supabase dashboard, not the project API. Use https://<project-ref>.supabase.co`;
  }
  if (!parsed.hostname.endsWith(".supabase.co") && !parsed.hostname.endsWith(".supabase.in")) {
    return `${key} does not look like a Supabase project API URL. Expected https://<project-ref>.supabase.co`;
  }
  return null;
}

function validateKey(key, prefixes) {
  if (!env[key]) return null;
  return prefixes.some((prefix) => env[key].startsWith(prefix))
    ? null
    : `${key} has an unexpected format`;
}

const invalidEnv = [
  validateSupabaseUrl("SUPABASE_URL"),
  validateSupabaseUrl("NEXT_PUBLIC_SUPABASE_URL"),
  validateKey("SUPABASE_PUBLISHABLE_KEY", ["sb_publishable_", "eyJ"]),
  validateKey("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", ["sb_publishable_", "eyJ"]),
  validateKey("SUPABASE_SERVICE_ROLE_KEY", ["sb_secret_", "eyJ"]),
].filter(Boolean);

console.log("Liquid Client Portal setup check\n");

if (missingFiles.length) {
  console.log("Missing required files:");
  missingFiles.forEach((file) => console.log(`- ${file}`));
} else {
  console.log("Required app files: ok");
}

if (missingEnv.length) {
  console.log("\nMissing required environment variables:");
  missingEnv.forEach((key) => console.log(`- ${key}`));
} else {
  console.log("Required environment variables: ok");
}

if (missingRecommendedEnv.length) {
  console.log("\nRecommended environment variables not set:");
  missingRecommendedEnv.forEach((key) => console.log(`- ${key}`));
  console.log("These are useful for deployed/public URLs and future client-side Supabase usage.");
} else {
  console.log("Recommended environment variables: ok");
}

if (invalidEnv.length) {
  console.log("\nInvalid environment values:");
  invalidEnv.forEach((message) => console.log(`- ${message}`));
}

console.log("\nRoutes expected:");
console.log("- /admin");
console.log("- /admin/login");
console.log("- /admin/projects/[id]");
console.log("- /p/[slug]");
console.log("- /b/[slug] -> /p/[slug]");

async function smokeTest(baseUrl) {
  const normalized = baseUrl.replace(/\/$/, "");
  const login = await fetch(`${normalized}/admin/login`, { method: "HEAD", redirect: "manual" });
  const legacy = await fetch(`${normalized}/b/setup-smoke`, { method: "HEAD", redirect: "manual" });
  const admin = await fetch(`${normalized}/admin`, { method: "HEAD", redirect: "manual" });

  const failures = [];
  if (login.status !== 200) failures.push(`/admin/login expected 200, got ${login.status}`);
  if (legacy.status !== 307 || legacy.headers.get("location") !== "/p/setup-smoke") {
    failures.push(`/b/setup-smoke expected 307 -> /p/setup-smoke, got ${legacy.status} -> ${legacy.headers.get("location")}`);
  }
  if (![200, 307].includes(admin.status)) failures.push(`/admin expected 200 or 307, got ${admin.status}`);
  return failures;
}

async function databaseCheck() {
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const failures = [];
  for (const [table, select] of requiredTables) {
    const { error } = await client.from(table).select(select).limit(1);
    if (error) failures.push(`${table}: ${error.message}`);
  }

  const { error: bucketError } = await client.storage.getBucket("project-materials");
  if (bucketError) failures.push(`project-materials bucket: ${bucketError.message}`);

  return failures;
}

if (!smokeOnly && (missingFiles.length || missingEnv.length || invalidEnv.length)) {
  console.log("\nSetup incomplete. Fix the items above, apply Supabase migrations, then run npm run verify.");
  process.exit(1);
}

if (smokeUrl) {
  console.log(`\nRunning smoke test against ${smokeUrl}...`);
  const failures = await smokeTest(smokeUrl);
  if (failures.length) {
    console.log("Smoke test failed:");
    failures.forEach((failure) => console.log(`- ${failure}`));
    process.exit(1);
  }
  console.log("Smoke test: ok");
}

if (dbCheck) {
  console.log("\nRunning database schema check...");
  const failures = await databaseCheck();
  if (failures.length) {
    console.log("Database schema check failed:");
    failures.forEach((failure) => console.log(`- ${failure}`));
    process.exit(1);
  }
  console.log("Database schema check: ok");
}

if (smokeOnly && (missingFiles.length || missingEnv.length || invalidEnv.length)) {
  console.log("\nSmoke-only mode completed. Full setup still has missing items listed above.");
} else {
  console.log("\nSetup looks ready. Apply Supabase migrations if you have not already, then run npm run verify.");
}
