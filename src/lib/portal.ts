import "server-only";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const db = () => supabaseAdmin as any;
const MATERIALS_BUCKET = "project-materials";
const ADMIN_TOKEN_COOKIE = "liquid_admin_token";
const LOCAL_ADMIN_COOKIE = "liquid_admin";
const schemaCapabilityCache = new Map<string, Promise<boolean>>();

export const projectStatuses = [
  "onboarding",
  "scelta_stile",
  "raccolta_materiali",
  "sviluppo_sito",
  "revisione_bozza",
  "approvazione_finale",
  "pubblicazione",
  "manutenzione_attiva",
] as const;

export type ProjectStatus = (typeof projectStatuses)[number];

export const statusLabels: Record<ProjectStatus, string> = {
  onboarding: "Onboarding",
  raccolta_materiali: "Raccolta materiali",
  scelta_stile: "Scelta stile",
  sviluppo_sito: "Sviluppo sito",
  revisione_bozza: "Revisione bozza",
  approvazione_finale: "Approvazione finale",
  pubblicazione: "Pubblicazione",
  manutenzione_attiva: "Manutenzione attiva",
};

export const nextActions: Record<ProjectStatus, string> = {
  onboarding: "Compila i dati iniziali e i dati per la fattura.",
  scelta_stile: "Scegli i riferimenti che ti piacciono e conferma la direzione creativa.",
  raccolta_materiali: "Carica logo, foto e documenti utili.",
  sviluppo_sito: "Liquid sta lavorando alla prima bozza. Non serve fare nulla ora.",
  revisione_bozza: "Apri la bozza e invia le richieste di modifica.",
  approvazione_finale: "Controlla la versione finale e approva la pubblicazione.",
  pubblicazione: "Liquid pubblichera' il sito dopo approvazione e saldo.",
  manutenzione_attiva: "Invia qui le richieste di aggiornamento del sito.",
};


export const creativeDirections = [
  "elegante e premium",
  "moderno e minimale",
  "caldo e umano",
  "creativo e distintivo",
  "istituzionale e professionale",
  "semplice e diretto",
] as const;

const checklistTemplate = [
  ["deposit_paid", "Acconto pagato"],
  ["initial_data_completed", "Dati iniziali compilati"],
  ["materials_uploaded", "Materiali caricati"],
  ["style_chosen", "Stile scelto"],
  ["draft_received", "Bozza ricevuta"],
  ["revisions_sent", "Revisioni inviate"],
  ["site_approved", "Sito approvato"],
  ["balance_paid", "Saldo pagato"],
  ["site_published", "Sito pubblicato"],
  ["maintenance_active", "Manutenzione attiva"],
] as const;

const paymentTemplate = [
  { type: "acconto", title: "Acconto", sort_order: 1 },
  { type: "saldo", title: "Saldo finale", sort_order: 2 },
  { type: "manutenzione", title: "Manutenzione mensile", sort_order: 3 },
] as const;

// Checklist keys that represent each phase being completed. When a project
// reaches a given status, every checklist key belonging to an earlier phase
// is considered done. Reaching "manutenzione_attiva" completes them all (100%).
const statusChecklistKeys: Record<ProjectStatus, readonly string[]> = {
  onboarding: ["deposit_paid", "initial_data_completed"],
  scelta_stile: ["style_chosen"],
  raccolta_materiali: ["materials_uploaded"],
  sviluppo_sito: ["draft_received"],
  revisione_bozza: ["revisions_sent"],
  approvazione_finale: ["site_approved"],
  pubblicazione: ["balance_paid", "site_published", "maintenance_active"],
  manutenzione_attiva: [],
};

// All checklist keys whose phase comes strictly before the given status.
function checklistKeysBefore(status: ProjectStatus): string[] {
  const idx = projectStatuses.indexOf(status);
  if (idx <= 0) return [];
  return projectStatuses.slice(0, idx).flatMap((s) => [...statusChecklistKeys[s]]);
}

export type PaymentSummary = {
  acconto: { amount: number | null; status: string; paid: boolean };
  saldo: { amount: number | null; status: string; paid: boolean };
  manutenzione: { amount: number | null; status: string; paid: boolean };
  paidTotal: number;
  owedTotal: number;
  mrr: number;
  mrrConfirmed: boolean;
};

function paymentByType(rows: any[], type: string) {
  return rows.find((row) => row.type === type) ?? null;
}

function paymentCell(row: any | null) {
  const amount = row?.amount != null ? Number(row.amount) : null;
  return {
    amount,
    status: row?.status ?? "da_pagare",
    paid: row?.status === "pagato",
  };
}

export function summarizeProjectPayments(projectPayments: any[]): PaymentSummary {
  const acconto = paymentCell(paymentByType(projectPayments, "acconto"));
  const saldo = paymentCell(paymentByType(projectPayments, "saldo"));
  const manutenzione = paymentCell(paymentByType(projectPayments, "manutenzione"));
  const paidTotal = [acconto, saldo]
    .filter((payment) => payment.paid && payment.amount)
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  const owedTotal = [acconto, saldo]
    .filter((payment) => !payment.paid && payment.amount)
    .reduce((sum, payment) => sum + (payment.amount ?? 0), 0);
  return {
    acconto,
    saldo,
    manutenzione,
    paidTotal,
    owedTotal,
    mrr: manutenzione.amount ?? 0,
    mrrConfirmed: manutenzione.paid,
  };
}

function inferProjectStatus(
  checklist: Map<string, boolean>,
  project: { maintenance_active?: boolean; draft_url?: string | null; published_url?: string | null },
): ProjectStatus {
  const done = (key: string) => checklist.get(key) === true;
  if (project.maintenance_active || done("maintenance_active")) return "manutenzione_attiva";
  if (done("site_published") || project.published_url) return "manutenzione_attiva";
  if (done("site_approved")) return "pubblicazione";
  if (done("revisions_sent")) return "approvazione_finale";
  if (done("draft_received") || project.draft_url) return "revisione_bozza";
  if (done("materials_uploaded")) return "sviluppo_sito";
  if (done("style_chosen")) return "raccolta_materiali";
  if (done("deposit_paid")) return "scelta_stile";
  return "onboarding";
}

async function syncProjectStatusFromProgress(projectId: string) {
  const [{ data: project }, { data: checklistRows }] = await Promise.all([
    db()
      .from("leads")
      .select("status, maintenance_active, draft_url, published_url")
      .eq("id", projectId)
      .maybeSingle(),
    db().from("project_checklist_items").select("key, completed").eq("project_id", projectId),
  ]);
  if (!project) return;
  const checklist = new Map<string, boolean>(
    (checklistRows ?? []).map((row: any) => [row.key as string, Boolean(row.completed)]),
  );
  const inferred = inferProjectStatus(checklist, project);
  const current = (project.status || "onboarding") as ProjectStatus;
  if (projectStatuses.indexOf(inferred) <= projectStatuses.indexOf(current)) return;
  await db()
    .from("leads")
    .update({
      status: inferred,
      next_action: nextActions[inferred],
      maintenance_active: inferred === "manutenzione_attiva" ? true : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);
}

export const PRODUCTION_PORTAL_URL = "https://liquid-client-portal.vercel.app";

/** Domains that must never be used for client links (owned by other Vercel projects). */
const BLOCKED_PUBLIC_BASE_URLS = new Set(["https://client-portal.vercel.app"]);

function normalizeBaseUrl(url?: string | null) {
  const trimmed = url?.trim().replace(/\/$/, "");
  if (!trimmed || BLOCKED_PUBLIC_BASE_URLS.has(trimmed)) return null;
  return trimmed;
}

export function resolvePublicBaseUrl(configuredBase?: string | null) {
  return (
    normalizeBaseUrl(configuredBase)
    ?? normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL)
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}` : null)
    ?? (process.env.NODE_ENV === "production" ? PRODUCTION_PORTAL_URL : "http://localhost:3000")
  );
}

export function publicClientPortalUrl(slug: string, configuredBase?: string | null) {
  return `${resolvePublicBaseUrl(configuredBase)}/p/${slug}`;
}

function slugify(input: string) {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  return `${base || "cliente"}-${crypto.randomUUID().split("-")[0]}`;
}

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function nullableValue(formData: FormData, key: string) {
  const raw = value(formData, key);
  return raw || null;
}

function isMissingColumnError(error: any, column: string) {
  const message = String(error?.message ?? "");
  return message.includes(`'${column}' column`) || message.includes(`.${column}`) || message.includes(`${column} does not exist`);
}

function optionalColumn(table: string, column: string) {
  const key = `${table}.${column}`;
  if (!schemaCapabilityCache.has(key)) {
    schemaCapabilityCache.set(
      key,
      db()
        .from(table)
        .select(column)
        .limit(1)
        .then(({ error }: any) => !error || !isMissingColumnError(error, column)),
    );
  }
  return schemaCapabilityCache.get(key)!;
}

async function portalCapabilities() {
  const [bookingUrl, clientMarkedPaidAt] = await Promise.all([
    optionalColumn("portal_settings", "booking_url"),
    optionalColumn("payments", "client_marked_paid_at"),
  ]);
  return { bookingUrl, clientMarkedPaidAt };
}

function createSupabaseAuthClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function ensureProjectDefaults(projectId: string) {
  const { data: checklist } = await db()
    .from("project_checklist_items")
    .select("id")
    .eq("project_id", projectId)
    .limit(1);

  if (!checklist?.length) {
    await db().from("project_checklist_items").insert(
      checklistTemplate.map(([key, label], index) => ({
        project_id: projectId,
        key,
        label,
        sort_order: index + 1,
      })),
    );
  }

  const { data: invoice } = await db()
    .from("invoice_profiles")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!invoice) await db().from("invoice_profiles").insert({ project_id: projectId });

  const { data: existingPayments } = await db()
    .from("payments")
    .select("type")
    .eq("project_id", projectId);
  const existingTypes = new Set((existingPayments ?? []).map((p: any) => p.type));
  const missingPayments = paymentTemplate.filter((p) => !existingTypes.has(p.type));
  if (missingPayments.length) {
    await db()
      .from("payments")
      .insert(missingPayments.map((payment) => ({ ...payment, project_id: projectId })));
  }

  const { data: brief } = await db()
    .from("briefs")
    .select("id")
    .eq("project_id", projectId)
    .maybeSingle();
  if (!brief) await db().from("briefs").insert({ project_id: projectId });
}

export async function requireAdmin() {
  const cookieStore = await cookies();
  const localPassword = process.env.LIQUID_ADMIN_PASSWORD;
  const localCookie = cookieStore.get(LOCAL_ADMIN_COOKIE)?.value;
  if (localPassword && localCookie === localPassword) return;

  const token = cookieStore.get(ADMIN_TOKEN_COOKIE)?.value;
  if (token) {
    const supabase = createSupabaseAuthClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser(token);
      if (data.user) return;
    }
  }

  redirect(localPassword || createSupabaseAuthClient() ? "/admin/login" : "/admin/login?error=missing-auth");
}

export async function loginAdmin(formData: FormData) {
  "use server";

  const email = value(formData, "email");
  const password = value(formData, "password");
  const cookieStore = await cookies();

  if (email) {
    const supabase = createSupabaseAuthClient();
    if (!supabase) redirect("/admin/login?error=missing-supabase-auth");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session?.access_token) redirect("/admin/login?error=1");
    cookieStore.set(ADMIN_TOKEN_COOKIE, data.session.access_token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: data.session.expires_in ?? 60 * 60 * 24 * 7,
    });
    cookieStore.delete(LOCAL_ADMIN_COOKIE);
    redirect("/admin");
  }

  const localPassword = process.env.LIQUID_ADMIN_PASSWORD;
  if (!localPassword || password !== localPassword) redirect("/admin/login?error=1");
  cookieStore.set(LOCAL_ADMIN_COOKIE, localPassword, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  cookieStore.delete(ADMIN_TOKEN_COOKIE);
  redirect("/admin");
}

export async function logoutAdmin() {
  "use server";

  const cookieStore = await cookies();
  cookieStore.delete(LOCAL_ADMIN_COOKIE);
  cookieStore.delete(ADMIN_TOKEN_COOKIE);
  redirect("/admin/login");
}

export async function getProjectBySlug(slug: string) {
  const { data, error } = await db().from("leads").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  await ensureProjectDefaults(data.id);
  return data;
}

export async function getProjectById(id: string) {
  const { data, error } = await db().from("leads").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  await ensureProjectDefaults(data.id);
  return data;
}

async function signedMaterials(rows: any[]) {
  return Promise.all(
    (rows ?? []).map(async (row) => {
      const { data } = await db()
        .storage
        .from(MATERIALS_BUCKET)
        .createSignedUrl(row.file_path, 60 * 60 * 24);
      return { ...row, signed_url: data?.signedUrl ?? null };
    }),
  );
}

export async function getPortalProject(project: any) {
  const projectId = project.id;
  await syncProjectStatusFromProgress(projectId);
  const { data: refreshedProject } = await db().from("leads").select("*").eq("id", projectId).maybeSingle();
  if (refreshedProject) project = refreshedProject;
  const capabilities = await portalCapabilities();
  const [
    checklist,
    invoice,
    payments,
    materials,
    brief,
    references,
    likes,
    comments,
    customInspirations,
    revisions,
    maintenance,
    settings,
  ] = await Promise.all([
    db().from("project_checklist_items").select("*").eq("project_id", projectId).order("sort_order"),
    db().from("invoice_profiles").select("*").eq("project_id", projectId).maybeSingle(),
    db().from("payments").select("*").eq("project_id", projectId).order("sort_order"),
    db().from("project_materials").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    db().from("briefs").select("*").eq("project_id", projectId).maybeSingle(),
    db().from("sites").select("*").order("sort_order"),
    db().from("likes").select("site_id").eq("lead_id", projectId),
    db().from("comments").select("id,site_id,body,created_at").eq("lead_id", projectId).not("site_id", "is", null).order("created_at", { ascending: false }),
    db().from("comments").select("id,body,created_at").eq("lead_id", projectId).is("site_id", null).order("created_at", { ascending: false }),
    db().from("revision_requests").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    db().from("maintenance_requests").select("*").eq("project_id", projectId).order("created_at", { ascending: false }),
    db().from("portal_settings").select("*").eq("id", 1).maybeSingle(),
  ]);

  const liked = new Set((likes.data ?? []).map((item: any) => item.site_id));
  const commentsBySite = new Map<string, any[]>();
  (comments.data ?? []).forEach((comment: any) => {
    const list = commentsBySite.get(comment.site_id) ?? [];
    list.push(comment);
    commentsBySite.set(comment.site_id, list);
  });
  const maintenanceIds = (maintenance.data ?? []).map((request: any) => request.id);
  const attachments = maintenanceIds.length
    ? await db()
        .from("request_attachments")
        .select("id,maintenance_request_id,file_name,file_path,file_type,file_size,created_at")
        .in("maintenance_request_id", maintenanceIds)
    : { data: [] };
  const attachmentsByMaintenance = new Map<string, any[]>();
  const signedAttachments = await signedMaterials(attachments.data ?? []);
  signedAttachments.forEach((attachment: any) => {
    const list = attachmentsByMaintenance.get(attachment.maintenance_request_id) ?? [];
    list.push(attachment);
    attachmentsByMaintenance.set(attachment.maintenance_request_id, list);
  });

  const status = (project.status || "onboarding") as ProjectStatus;

  return {
    project: {
      ...project,
      status,
      status_label: statusLabels[status],
      next_action: project.next_action || nextActions[status],
    },
    checklist: (checklist.data ?? []).filter((item: any) => item.key !== "quote_accepted"),
    invoice: invoice.data ?? null,
    payments: payments.data ?? [],
    materials: await signedMaterials(materials.data ?? []),
    brief: brief.data ?? null,
    styleReferences: (references.data ?? []).map((reference: any) => ({
      ...reference,
      liked: liked.has(reference.id),
      comments: commentsBySite.get(reference.id) ?? [],
    })),
    customInspirations: customInspirations.data ?? [],
    revisionRequests: revisions.data ?? [],
    maintenanceRequests: (maintenance.data ?? []).map((request: any) => ({
      ...request,
      attachments: attachmentsByMaintenance.get(request.id) ?? [],
    })),
    settings: settings.data ?? null,
    capabilities,
  };
}

export type ClientActivityEvent = {
  id: string;
  type: string;
  label: string;
  detail: string | null;
  at: string;
};

export async function getClientActivity(projectId: string): Promise<ClientActivityEvent[]> {
  await requireAdmin();
  const capabilities = await portalCapabilities();

  const [
    revisions,
    maintenance,
    materials,
    payments,
    brief,
    invoice,
    likes,
    comments,
    project,
  ] = await Promise.all([
    db().from("revision_requests").select("id,page,section,comment,created_at").eq("project_id", projectId),
    db().from("maintenance_requests").select("id,title,request_type,created_at").eq("project_id", projectId),
    db().from("project_materials").select("id,file_name,category,uploaded_by,created_at").eq("project_id", projectId),
    capabilities.clientMarkedPaidAt
      ? db().from("payments").select("id,title,amount,client_marked_paid_at").eq("project_id", projectId).not("client_marked_paid_at", "is", null)
      : Promise.resolve({ data: [] }),
    db().from("briefs").select("submitted_at").eq("project_id", projectId).maybeSingle(),
    db().from("invoice_profiles").select("updated_at").eq("project_id", projectId).maybeSingle(),
    db().from("likes").select("id,site_id,created_at").eq("lead_id", projectId),
    db().from("comments").select("id,site_id,body,created_at").eq("lead_id", projectId),
    db().from("leads").select("creative_direction,creative_direction_confirmed_at,approved_at").eq("id", projectId).maybeSingle(),
  ]);

  const siteIds = Array.from(new Set([
    ...(likes.data ?? []).map((row: any) => row.site_id),
    ...(comments.data ?? []).map((row: any) => row.site_id),
  ].filter(Boolean)));
  const { data: sites } = siteIds.length
    ? await db().from("sites").select("id,title").in("id", siteIds)
    : { data: [] };
  const siteTitle = new Map<string, string>((sites ?? []).map((site: any) => [site.id, site.title || "Riferimento stile"]));

  const events: ClientActivityEvent[] = [];

  (revisions.data ?? []).forEach((row: any) => {
    events.push({
      id: `revision-${row.id}`,
      type: "revision",
      label: "Richiesta di modifica",
      detail: `${row.page}${row.section ? ` · ${row.section}` : ""}: ${row.comment}`,
      at: row.created_at,
    });
  });

  (maintenance.data ?? []).forEach((row: any) => {
    events.push({
      id: `maintenance-${row.id}`,
      type: "maintenance",
      label: "Richiesta di assistenza",
      detail: `${row.title}${row.request_type ? ` (${row.request_type})` : ""}`,
      at: row.created_at,
    });
  });

  (materials.data ?? []).forEach((row: any) => {
    events.push({
      id: `material-${row.id}`,
      type: "material",
      label: row.uploaded_by === "client" ? "Materiale caricato" : "Materiale aggiunto",
      detail: `${row.file_name}${row.category ? ` · ${row.category}` : ""}`,
      at: row.created_at,
    });
  });

  (payments.data ?? []).forEach((row: any) => {
    events.push({
      id: `payment-${row.id}`,
      type: "payment",
      label: "Pagamento segnalato",
      detail: `${row.title}${row.amount ? ` · ${Number(row.amount).toLocaleString("it-IT")} €` : ""}`,
      at: row.client_marked_paid_at,
    });
  });

  (likes.data ?? []).forEach((row: any) => {
    events.push({
      id: `like-${row.id}`,
      type: "like",
      label: "Mi piace su uno stile",
      detail: siteTitle.get(row.site_id) ?? null,
      at: row.created_at,
    });
  });

  (comments.data ?? []).forEach((row: any) => {
    const isInspiration = !row.site_id;
    events.push({
      id: `comment-${row.id}`,
      type: isInspiration ? "inspiration" : "comment",
      label: isInspiration ? "Link ispirazione inviato" : "Commento su uno stile",
      detail: isInspiration ? row.body : `${siteTitle.get(row.site_id) ?? "Riferimento"}: ${row.body}`,
      at: row.created_at,
    });
  });

  if (brief.data?.submitted_at) {
    events.push({
      id: "brief-submitted",
      type: "brief",
      label: "Brief inviato",
      detail: null,
      at: brief.data.submitted_at,
    });
  }

  if (invoice.data?.updated_at) {
    events.push({
      id: "invoice-updated",
      type: "invoice",
      label: "Dati di fatturazione aggiornati",
      detail: null,
      at: invoice.data.updated_at,
    });
  }

  if (project.data?.creative_direction_confirmed_at) {
    events.push({
      id: "creative-direction",
      type: "direction",
      label: "Direzione creativa confermata",
      detail: project.data.creative_direction ?? null,
      at: project.data.creative_direction_confirmed_at,
    });
  }

  if (project.data?.approved_at) {
    events.push({
      id: "approved",
      type: "approval",
      label: "Sito approvato",
      detail: null,
      at: project.data.approved_at,
    });
  }

  return events
    .filter((event) => Boolean(event.at))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}

export async function listProjects() {
  await requireAdmin();
  const { data, error } = await db().from("leads").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  let projects = data ?? [];
  if (projects.length) {
    await Promise.all(projects.map((project: any) => syncProjectStatusFromProgress(project.id)));
    const { data: refreshed, error: refreshError } = await db()
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (refreshError) throw new Error(refreshError.message);
    projects = refreshed ?? projects;
  }
  const ids = projects.map((project: any) => project.id);
  if (!ids.length) return [];

  const [revisions, maintenance, materials, payments, invoices, briefs, comments, checklist, capabilities] = await Promise.all([
    db().from("revision_requests").select("project_id,status,created_at").in("project_id", ids),
    db().from("maintenance_requests").select("project_id,status,created_at").in("project_id", ids),
    db().from("project_materials").select("project_id,created_at").in("project_id", ids),
    db().from("payments").select("*").in("project_id", ids),
    db().from("invoice_profiles").select("project_id,updated_at").in("project_id", ids),
    db().from("briefs").select("project_id,updated_at,submitted_at").in("project_id", ids),
    db().from("comments").select("lead_id,created_at").in("lead_id", ids),
    db().from("project_checklist_items").select("project_id,key,completed").in("project_id", ids),
    portalCapabilities(),
  ]);

  const count = (rows: any[], projectId: string, predicate?: (row: any) => boolean) =>
    (rows ?? []).filter((row) => row.project_id === projectId && (!predicate || predicate(row))).length;
  const latestDate = (dates: Array<string | null | undefined>) => {
    const timestamps = dates.filter(Boolean).map((date) => new Date(String(date)).getTime()).filter(Number.isFinite);
    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps)).toISOString();
  };
  const daysSince = (date: string | null) => date
    ? Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24)))
    : null;

  return projects.map((project: any) => {
    const status = (project.status || "onboarding") as ProjectStatus;
    const projectRevisions = (revisions.data ?? []).filter((row: any) => row.project_id === project.id);
    const projectMaintenance = (maintenance.data ?? []).filter((row: any) => row.project_id === project.id);
    const projectMaterials = (materials.data ?? []).filter((row: any) => row.project_id === project.id);
    const projectPayments = (payments.data ?? []).filter((row: any) => row.project_id === project.id);
    const projectInvoices = (invoices.data ?? []).filter((row: any) => row.project_id === project.id);
    const projectBriefs = (briefs.data ?? []).filter((row: any) => row.project_id === project.id);
    const projectComments = (comments.data ?? []).filter((row: any) => row.lead_id === project.id);
    const lastClientActionAt = latestDate([
      ...projectMaterials.map((row: any) => row.created_at),
      ...projectRevisions.map((row: any) => row.created_at),
      ...projectMaintenance.map((row: any) => row.created_at),
      ...projectPayments.map((row: any) => row.client_marked_paid_at),
      ...projectInvoices.map((row: any) => row.updated_at),
      ...projectBriefs.map((row: any) => row.submitted_at || row.updated_at),
      ...projectComments.map((row: any) => row.created_at),
    ]);
    const paymentsSummary = summarizeProjectPayments(projectPayments);
    return {
      ...project,
      status_label: statusLabels[status],
      next_action: project.next_action || nextActions[status],
      revision_open_count: count(revisions.data, project.id, (row) => row.status !== "completata"),
      maintenance_open_count: count(maintenance.data, project.id, (row) => row.status !== "completata"),
      materials_count: count(materials.data, project.id),
      deposit_paid: paymentsSummary.acconto.paid,
      balance_paid: paymentsSummary.saldo.paid,
      payments_summary: paymentsSummary,
      payment_pending_count: capabilities.clientMarkedPaidAt ? count(payments.data, project.id, (row) => row.client_marked_paid_at && row.status !== "pagato") : 0,
      last_client_action_at: lastClientActionAt,
      inactive_days: daysSince(lastClientActionAt),
      checklist_percent: (() => {
        const items = (checklist.data ?? []).filter((row: any) => row.project_id === project.id && row.key !== "quote_accepted");
        if (!items.length) return 0;
        return Math.round((items.filter((row: any) => row.completed).length / items.length) * 100);
      })(),
    };
  });
}

export async function listAdminRequestQueue() {
  await requireAdmin();
  const capabilities = await portalCapabilities();
  const [revisionRes, paymentRes, maintenanceRes] = await Promise.all([
    db()
      .from("revision_requests")
      .select("id,project_id,page,section,comment,priority,status,created_at")
      .neq("status", "completata")
      .order("created_at", { ascending: false })
      .limit(12),
    capabilities.clientMarkedPaidAt
      ? db()
          .from("payments")
          .select("id,project_id,title,amount,status,client_marked_paid_at,updated_at")
          .not("client_marked_paid_at", "is", null)
          .neq("status", "pagato")
          .order("client_marked_paid_at", { ascending: false })
          .limit(12)
      : Promise.resolve({ data: [] }),
    db()
      .from("maintenance_requests")
      .select("id,project_id,title,description,request_type,priority,status,created_at")
      .neq("status", "completata")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  const rows = [
    ...(revisionRes.data ?? []).map((row: any) => ({ ...row, queue_type: "revision" })),
    ...(maintenanceRes.data ?? []).map((row: any) => ({ ...row, queue_type: "maintenance" })),
    ...(paymentRes.data ?? []).map((row: any) => ({ ...row, queue_type: "payment", created_at: row.client_marked_paid_at })),
  ].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 16);

  const projectIds = Array.from(new Set(rows.map((row: any) => row.project_id).filter(Boolean)));
  const { data: projects } = projectIds.length
    ? await db().from("leads").select("id,name,company_name,slug,status").in("id", projectIds)
    : { data: [] };
  const projectMap = new Map((projects ?? []).map((project: any) => [project.id, project]));

  return rows.map((row: any) => ({
    ...row,
    project: projectMap.get(row.project_id) ?? null,
  }));
}

export async function getPortalSettings() {
  await requireAdmin();
  const { data, error } = await db().from("portal_settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

export async function listStyleReferences() {
  await requireAdmin();
  const { data, error } = await db()
    .from("sites")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createStyleReference(formData: FormData) {
  "use server";

  await requireAdmin();
  const title = nullableValue(formData, "title");
  const linkUrl = nullableValue(formData, "link_url");
  const imageUrl = nullableValue(formData, "image_url");
  const file = formData.get("image_file");
  let finalImageUrl = imageUrl;
  const width: number | null = null;
  const height: number | null = null;

  if (file instanceof File && file.size > 0) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160);
    const ext = safeName.split(".").pop() || "jpg";
    const path = `style-references/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await db().storage
      .from("sites")
      .upload(path, buffer, { contentType: file.type || "image/jpeg", upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { data } = db().storage.from("sites").getPublicUrl(path);
    finalImageUrl = data.publicUrl;
  }

  if (!finalImageUrl && linkUrl) {
    try {
      const host = new URL(linkUrl).hostname;
      finalImageUrl = `https://www.google.com/s2/favicons?domain=${host}&sz=256`;
    } catch {
      finalImageUrl = null;
    }
  }

  if (!finalImageUrl) throw new Error("Aggiungi un'immagine, un URL immagine o un link sito.");

  const { data: minRow } = await db()
    .from("sites")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const nextOrder = (minRow?.sort_order ?? 1) - 1;

  const { error } = await db().from("sites").insert({
    title,
    image_url: finalImageUrl,
    link_url: linkUrl,
    width,
    height,
    sort_order: nextOrder,
    is_liquid: value(formData, "is_liquid") === "on",
    screenshot_status: "ready",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function deleteStyleReference(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = value(formData, "id");
  const { data: site } = await db().from("sites").select("image_url").eq("id", id).maybeSingle();
  if (site?.image_url?.includes("/sites/")) {
    const path = site.image_url.split("/sites/")[1];
    if (path) await db().storage.from("sites").remove([path]);
  }
  const { error } = await db().from("sites").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function createProject(formData: FormData) {
  "use server";

  await requireAdmin();
  const payload = z.object({
    name: z.string().trim().min(1),
    company_name: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
  }).parse({
    name: value(formData, "name"),
    company_name: value(formData, "company_name"),
    email: value(formData, "email"),
    phone: value(formData, "phone"),
  });

  let slug = slugify(payload.name);
  for (let i = 0; i < 5; i++) {
    const { data: exists } = await db().from("leads").select("id").eq("slug", slug).maybeSingle();
    if (!exists) break;
    slug = slugify(payload.name);
  }

  const { data, error } = await db()
    .from("leads")
    .insert({
      name: payload.name,
      company_name: payload.company_name || null,
      email: payload.email || null,
      phone: payload.phone || null,
      slug,
      status: "onboarding",
      next_action: nextActions.onboarding,
    })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await ensureProjectDefaults(data.id);
  revalidatePath("/admin");
  redirect(`/admin/projects/${data.id}`);
}

export async function updateProject(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = value(formData, "id");
  const status = value(formData, "status") as ProjectStatus;
  const patch: any = {
    name: value(formData, "name"),
    company_name: nullableValue(formData, "company_name"),
    email: nullableValue(formData, "email"),
    phone: nullableValue(formData, "phone"),
    status,
    next_action: nullableValue(formData, "next_action") || nextActions[status],
    draft_url: nullableValue(formData, "draft_url"),
    published_url: nullableValue(formData, "published_url"),
    maintenance_active: value(formData, "maintenance_active") === "on",
    internal_notes: nullableValue(formData, "internal_notes"),
    updated_at: new Date().toISOString(),
  };
  const { error } = await db().from("leads").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  // Changing the stage forward auto-completes every checklist item of the
  // earlier phases, so progress reflects the new status (manutenzione = 100%).
  const earlierKeys = checklistKeysBefore(status);
  if (earlierKeys.length) await markChecklist(id, earlierKeys);
  if (patch.draft_url) {
    await markChecklist(id, ["draft_received"]);
    await advanceProjectStatus(id, "sviluppo_sito", "revisione_bozza");
  }
  if (patch.published_url) {
    await markChecklist(id, ["site_published"]);
    await advanceProjectStatus(id, "pubblicazione", "manutenzione_attiva");
  }
  if (patch.maintenance_active) {
    await markChecklist(id, ["maintenance_active"]);
    await advanceProjectStatus(id, "pubblicazione", "manutenzione_attiva");
  }
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${id}`);
}

export async function updatePayment(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = value(formData, "id");
  const projectId = value(formData, "project_id");
  const status = value(formData, "status");
  const amount = value(formData, "amount");
  const capabilities = await portalCapabilities();
  const patch: any = {
    title: value(formData, "title"),
    amount: amount ? Number(amount) : null,
    status,
    method: value(formData, "method") || "bonifico",
    payment_url: nullableValue(formData, "payment_url"),
    payment_instructions: nullableValue(formData, "payment_instructions"),
    paid_at: status === "pagato" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (capabilities.clientMarkedPaidAt && status === "pagato") patch.client_marked_paid_at = null;
  const { data, error } = await db()
    .from("payments")
    .update(patch)
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (data.type === "acconto" && data.status === "pagato") {
    await markChecklist(projectId, ["deposit_paid"]);
    await advanceProjectStatus(projectId, "onboarding", "scelta_stile");
  }
  if (data.type === "saldo" && data.status === "pagato") await markChecklist(projectId, ["balance_paid"]);
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updatePaymentQuick(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = value(formData, "id");
  const projectId = value(formData, "project_id");
  const status = value(formData, "status");
  const amount = value(formData, "amount");
  const capabilities = await portalCapabilities();
  const patch: any = {
    amount: amount ? Number(amount) : null,
    status,
    payment_url: nullableValue(formData, "payment_url"),
    paid_at: status === "pagato" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
  if (capabilities.clientMarkedPaidAt && status === "pagato") patch.client_marked_paid_at = null;
  const { data, error } = await db()
    .from("payments")
    .update(patch)
    .eq("id", id)
    .eq("project_id", projectId)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (data.type === "acconto" && data.status === "pagato") {
    await markChecklist(projectId, ["deposit_paid"]);
    await advanceProjectStatus(projectId, "onboarding", "scelta_stile");
  }
  if (data.type === "saldo" && data.status === "pagato") await markChecklist(projectId, ["balance_paid"]);
  revalidatePath(`/admin/projects/${projectId}`);
  revalidatePath(`/admin/projects/${projectId}/pagamenti`);
}

export async function updateProjectPricing(formData: FormData) {
  "use server";

  await requireAdmin();
  const projectId = value(formData, "project_id");
  const siteTotal = Number(value(formData, "site_total") || 0);
  const monthlyAmount = Number(value(formData, "monthly_amount") || 0);
  const depositAmount = siteTotal > 0 ? Math.round((siteTotal / 2) * 100) / 100 : null;
  const balanceAmount = siteTotal > 0 && depositAmount !== null ? Math.round((siteTotal - depositAmount) * 100) / 100 : null;
  const now = new Date().toISOString();

  await Promise.all([
    db().from("payments").update({
      title: "Acconto",
      amount: depositAmount,
      method: "bonifico",
      payment_url: nullableValue(formData, "site_payment_url"),
      payment_instructions: nullableValue(formData, "site_payment_instructions"),
      updated_at: now,
    }).eq("project_id", projectId).eq("type", "acconto"),
    db().from("payments").update({
      title: "Saldo finale",
      amount: balanceAmount,
      method: "bonifico",
      payment_url: nullableValue(formData, "site_payment_url"),
      payment_instructions: nullableValue(formData, "site_payment_instructions"),
      updated_at: now,
    }).eq("project_id", projectId).eq("type", "saldo"),
    db().from("payments").update({
      title: "Manutenzione mensile",
      amount: monthlyAmount || null,
      method: "stripe",
      payment_url: nullableValue(formData, "stripe_url"),
      payment_instructions: nullableValue(formData, "maintenance_payment_instructions"),
      updated_at: now,
    }).eq("project_id", projectId).eq("type", "manutenzione"),
  ]);

  revalidatePath(`/admin/projects/${projectId}`);
}

async function syncPaymentFromChecklist(projectId: string, type: string, paid: boolean) {
  const now = new Date().toISOString();
  const capabilities = await portalCapabilities();
  const patch: any = {
    status: paid ? "pagato" : "da_pagare",
    paid_at: paid ? now : null,
    updated_at: now,
  };
  if (capabilities.clientMarkedPaidAt) patch.client_marked_paid_at = null;
  await db()
    .from("payments")
    .update(patch)
    .eq("project_id", projectId)
    .eq("type", type);
}

export async function deleteProject(formData: FormData) {
  "use server";

  await requireAdmin();
  const projectId = value(formData, "id");
  if (!projectId) return;
  const { data: maintenance } = await db().from("maintenance_requests").select("id").eq("project_id", projectId);
  const maintenanceIds = (maintenance ?? []).map((row: any) => row.id);

  if (maintenanceIds.length) await db().from("request_attachments").delete().in("maintenance_request_id", maintenanceIds);
  await Promise.all([
    db().from("revision_requests").delete().eq("project_id", projectId),
    db().from("maintenance_requests").delete().eq("project_id", projectId),
    db().from("project_materials").delete().eq("project_id", projectId),
    db().from("invoice_profiles").delete().eq("project_id", projectId),
    db().from("briefs").delete().eq("project_id", projectId),
    db().from("payments").delete().eq("project_id", projectId),
    db().from("project_checklist_items").delete().eq("project_id", projectId),
    db().from("likes").delete().eq("lead_id", projectId),
    db().from("comments").delete().eq("lead_id", projectId),
  ]);
  const { error } = await db().from("leads").delete().eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function clientMarkPaymentPaid(formData: FormData) {
  "use server";

  const capabilities = await portalCapabilities();
  if (!capabilities.clientMarkedPaidAt) throw new Error("Schema Supabase da aggiornare: manca payments.client_marked_paid_at.");
  const slug = value(formData, "slug");
  const paymentId = value(formData, "payment_id");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const { error } = await db()
    .from("payments")
    .update({
      client_marked_paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("project_id", project.id)
    .neq("status", "pagato");
  if (error) throw new Error(error.message);
  await markChecklist(project.id, ["deposit_paid"]);
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function clientConfirmFinalPayment(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const paymentId = value(formData, "payment_id");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const capabilities = await portalCapabilities();
  const patch: any = {
    status: "pagato",
    paid_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (capabilities.clientMarkedPaidAt) patch.client_marked_paid_at = null;
  const { data: payment, error } = await db()
    .from("payments")
    .update(patch)
    .eq("id", paymentId)
    .eq("project_id", project.id)
    .in("type", ["saldo", "manutenzione"])
    .select("type")
    .single();
  if (error) throw new Error(error.message);
  if (payment?.type === "saldo") await markChecklist(project.id, ["balance_paid"]);

  const { data: payments } = await db()
    .from("payments")
    .select("type,status")
    .eq("project_id", project.id)
    .in("type", ["saldo", "manutenzione"]);
  const saldoPaid = (payments ?? []).some((row: any) => row.type === "saldo" && row.status === "pagato");
  const maintenancePaid = (payments ?? []).some((row: any) => row.type === "manutenzione" && row.status === "pagato");
  if (saldoPaid && maintenancePaid) {
    await markChecklist(project.id, ["balance_paid", "maintenance_active"]);
    await advanceProjectStatus(project.id, "pubblicazione", "manutenzione_attiva");
  }
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath("/admin/manutenzione");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function updateChecklistItem(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = value(formData, "id");
  const projectId = value(formData, "project_id");
  const completed = value(formData, "completed") === "on";
  const { data, error } = await db()
    .from("project_checklist_items")
    .update({
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("project_id", projectId)
    .select("key,sort_order")
    .single();
  if (error) throw new Error(error.message);
  // When a step is marked complete, auto-complete every earlier step too.
  if (completed && typeof data?.sort_order === "number") {
    const { error: cascadeError } = await db()
      .from("project_checklist_items")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("project_id", projectId)
      .lt("sort_order", data.sort_order)
      .eq("completed", false);
    if (cascadeError) throw new Error(cascadeError.message);
  }
  if (data?.key === "deposit_paid") await syncPaymentFromChecklist(projectId, "acconto", completed);
  if (data?.key === "balance_paid") await syncPaymentFromChecklist(projectId, "saldo", completed);
  if (data?.key === "maintenance_active") await syncPaymentFromChecklist(projectId, "manutenzione", completed);
  if (completed && data?.key === "deposit_paid") await advanceProjectStatus(projectId, "onboarding", "scelta_stile");
  if (completed && data?.key === "style_chosen") await advanceProjectStatus(projectId, "scelta_stile", "raccolta_materiali");
  if (completed && data?.key === "materials_uploaded") await advanceProjectStatus(projectId, "raccolta_materiali", "sviluppo_sito");
  if (completed && data?.key === "draft_received") await advanceProjectStatus(projectId, "sviluppo_sito", "revisione_bozza");
  if (completed && data?.key === "revisions_sent") await advanceProjectStatus(projectId, "revisione_bozza", "approvazione_finale");
  if (completed && data?.key === "site_approved") await advanceProjectStatus(projectId, "approvazione_finale", "pubblicazione");
  if (completed && data?.key === "site_published") await advanceProjectStatus(projectId, "pubblicazione", "manutenzione_attiva");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function updateInvoice(formData: FormData) {
  "use server";

  const projectId = value(formData, "project_id");
  const slug = value(formData, "slug");
  const project = slug ? await getProjectBySlug(slug) : await getProjectById(projectId);
  if (!slug) await requireAdmin();
  if (!project) throw new Error("Progetto non trovato");
  const patch: any = {
    project_id: project.id,
    updated_at: new Date().toISOString(),
  };
  [
    "billing_name",
    "vat_number",
    "tax_code",
    "billing_address",
    "postal_code",
    "city",
    "province",
    "country",
    "sdi_code",
    "pec",
    "billing_email",
    "notes",
  ].forEach((key) => {
    if (formData.has(key)) patch[key] = nullableValue(formData, key);
  });
  const { error } = await db().from("invoice_profiles").upsert(patch, { onConflict: "project_id" });
  if (error) throw new Error(error.message);
  await markChecklist(project.id, ["initial_data_completed"]);
  revalidatePath(`/p/${project.slug}`);
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function completeOnboarding(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  await markChecklist(project.id, ["initial_data_completed"]);
  await advanceProjectStatus(project.id, "onboarding", "scelta_stile");
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function updateBrief(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const isSingleBriefSave = formData.has("free_notes")
    && !formData.has("business_description")
    && !formData.has("main_services")
    && !formData.has("website_goal")
    && !formData.has("ideal_audience")
    && !formData.has("message_to_communicate")
    && !formData.has("main_cta")
    && !formData.has("social_links")
    && !formData.has("current_website");
  const patch = isSingleBriefSave ? {
    project_id: project.id,
    free_notes: nullableValue(formData, "free_notes"),
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } : {
    project_id: project.id,
    business_description: nullableValue(formData, "business_description"),
    main_services: nullableValue(formData, "main_services"),
    website_goal: nullableValue(formData, "website_goal"),
    ideal_audience: nullableValue(formData, "ideal_audience"),
    message_to_communicate: nullableValue(formData, "message_to_communicate"),
    main_cta: nullableValue(formData, "main_cta"),
    social_links: nullableValue(formData, "social_links"),
    current_website: nullableValue(formData, "current_website"),
    free_notes: nullableValue(formData, "free_notes"),
    submitted_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error } = await db().from("briefs").upsert(patch, { onConflict: "project_id" });
  if (error) throw new Error(error.message);
  await markChecklist(project.id, ["initial_data_completed"]);
  revalidatePath(`/p/${slug}`);
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function completeMaterials(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  await markChecklist(project.id, ["materials_uploaded"]);
  await syncProjectStatusFromProgress(project.id);
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function uploadMaterial(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const files = formData.getAll("files").filter((file): file is File => file instanceof File && file.size > 0);
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160);
    const ext = safeName.split(".").pop() || "bin";
    const requestedCategory = value(formData, "category");
    const category = ["logo", "foto", "documenti"].includes(requestedCategory) ? requestedCategory : "documenti";
    const path = `${project.id}/${category}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await db().storage
      .from(MATERIALS_BUCKET)
      .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    const { error } = await db().from("project_materials").insert({
      project_id: project.id,
      category,
      file_name: file.name,
      file_path: path,
      file_type: file.type || null,
      file_size: file.size,
      note: nullableValue(formData, "note"),
      uploaded_by: "client",
    });
    if (error) throw new Error(error.message);
  }
  revalidatePath(`/p/${slug}`);
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function toggleStyleLike(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const siteId = value(formData, "site_id");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const { data: existing } = await db()
    .from("likes")
    .select("id")
    .eq("lead_id", project.id)
    .eq("site_id", siteId)
    .maybeSingle();
  if (existing) await db().from("likes").delete().eq("id", existing.id);
  else await db().from("likes").insert({ lead_id: project.id, site_id: siteId });
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function addStyleComment(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const { error } = await db().from("comments").insert({
    lead_id: project.id,
    site_id: value(formData, "site_id"),
    author_name: project.name,
    body: value(formData, "body"),
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function addCustomInspiration(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const inspirationUrl = value(formData, "inspiration_url");
  if (!inspirationUrl) return;
  const { error } = await db().from("comments").insert({
    lead_id: project.id,
    site_id: null,
    author_name: project.name,
    body: inspirationUrl,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function confirmStyleSelection(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const [{ count: likesCount }, { count: commentsCount }] = await Promise.all([
    db().from("likes").select("id", { count: "exact", head: true }).eq("lead_id", project.id),
    db().from("comments").select("id", { count: "exact", head: true }).eq("lead_id", project.id),
  ]);
  if (!likesCount && !commentsCount) {
    throw new Error("Metti almeno un like o un commento prima di continuare.");
  }
  await markChecklist(project.id, ["style_chosen"]);
  await syncProjectStatusFromProgress(project.id);
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function confirmCreativeDirection(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const { error } = await db().from("leads").update({
    creative_direction: value(formData, "creative_direction"),
    creative_direction_confirmed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", project.id);
  if (error) throw new Error(error.message);
  await markChecklist(project.id, ["style_chosen"]);
  await advanceProjectStatus(project.id, "scelta_stile", "raccolta_materiali");
  revalidatePath(`/p/${slug}`);
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function createRevision(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const { error } = await db().from("revision_requests").insert({
    project_id: project.id,
    page: value(formData, "page"),
    section: nullableValue(formData, "section"),
    comment: value(formData, "comment"),
    priority: value(formData, "priority") || "media",
  });
  if (error) throw new Error(error.message);
  await markChecklist(project.id, ["revisions_sent"]);
  await advanceProjectStatus(project.id, "revisione_bozza", "approvazione_finale");
  revalidatePath(`/p/${slug}`);
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function submitApprovalFeedback(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const { error } = await db().from("revision_requests").insert({
    project_id: project.id,
    page: value(formData, "page"),
    section: nullableValue(formData, "section"),
    comment: value(formData, "comment"),
    priority: value(formData, "priority") || "media",
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/p/${slug}`);
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function updateRevisionStatus(formData: FormData) {
  "use server";

  await requireAdmin();
  const projectId = value(formData, "project_id");
  const { error } = await db()
    .from("revision_requests")
    .update({ status: value(formData, "status"), updated_at: new Date().toISOString() })
    .eq("id", value(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function approveProject(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const approvedAt = new Date().toISOString();
  const { error } = await db().from("leads").update({
    approved_at: approvedAt,
    status: "pubblicazione",
    next_action: nextActions.pubblicazione,
    updated_at: approvedAt,
  }).eq("id", project.id);
  if (error) throw new Error(error.message);
  await markChecklist(project.id, ["site_approved"]);
  revalidatePath(`/p/${slug}`);
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function createMaintenance(formData: FormData) {
  "use server";

  const slug = value(formData, "slug");
  const project = await getProjectBySlug(slug);
  if (!project) throw new Error("Progetto non trovato");
  const { data: request, error } = await db().from("maintenance_requests").insert({
    project_id: project.id,
    title: value(formData, "title"),
    description: value(formData, "description"),
    request_type: value(formData, "request_type") || "altro",
    priority: value(formData, "priority") || "media",
  }).select().single();
  if (error) throw new Error(error.message);

  const files = formData.getAll("attachments").filter((file): file is File => file instanceof File && file.size > 0);
  const attachmentRows = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 160);
    const ext = safeName.split(".").pop() || "bin";
    const path = `${project.id}/maintenance/${request.id}/${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await db().storage
      .from(MATERIALS_BUCKET)
      .upload(path, buffer, { contentType: file.type || "application/octet-stream", upsert: false });
    if (uploadError) throw new Error(uploadError.message);
    attachmentRows.push({
      maintenance_request_id: request.id,
      file_name: file.name,
      file_path: path,
      file_type: file.type || null,
      file_size: file.size,
    });
  }
  if (attachmentRows.length) {
    const { error: attachmentError } = await db().from("request_attachments").insert(attachmentRows);
    if (attachmentError) throw new Error(attachmentError.message);
  }
  revalidatePath(`/p/${slug}`);
  revalidatePath(`/admin/projects/${project.id}`);
}

export async function updateMaintenanceStatus(formData: FormData) {
  "use server";

  await requireAdmin();
  const projectId = value(formData, "project_id");
  const { error } = await db()
    .from("maintenance_requests")
    .update({ status: value(formData, "status"), updated_at: new Date().toISOString() })
    .eq("id", value(formData, "id"));
  if (error) throw new Error(error.message);
  revalidatePath("/admin/manutenzione");
  revalidatePath(`/admin/projects/${projectId}`);
}

export async function listMaintenanceRequests() {
  await requireAdmin();
  const { data: requests, error } = await db()
    .from("maintenance_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const rows = requests ?? [];
  const projectIds = Array.from(new Set(rows.map((row: any) => row.project_id).filter(Boolean)));
  const requestIds = rows.map((row: any) => row.id);
  const [{ data: projects }, attachments] = await Promise.all([
    projectIds.length
      ? db().from("leads").select("id,name,company_name,slug,status,email").in("id", projectIds)
      : Promise.resolve({ data: [] }),
    requestIds.length
      ? db()
          .from("request_attachments")
          .select("id,maintenance_request_id,file_name,file_path,file_type,file_size,created_at")
          .in("maintenance_request_id", requestIds)
      : Promise.resolve({ data: [] }),
  ]);
  const projectMap = new Map((projects ?? []).map((project: any) => [project.id, project]));
  const signedAttachments = await signedMaterials(attachments.data ?? []);
  const attachmentsByRequest = new Map<string, any[]>();
  signedAttachments.forEach((attachment: any) => {
    const list = attachmentsByRequest.get(attachment.maintenance_request_id) ?? [];
    list.push(attachment);
    attachmentsByRequest.set(attachment.maintenance_request_id, list);
  });
  return rows.map((request: any) => ({
    ...request,
    project: projectMap.get(request.project_id) ?? null,
    attachments: attachmentsByRequest.get(request.id) ?? [],
  }));
}

export async function updateSettings(formData: FormData) {
  "use server";

  await requireAdmin();
  const capabilities = await portalCapabilities();
  let publicBaseUrl = nullableValue(formData, "default_public_base_url");
  if (publicBaseUrl && BLOCKED_PUBLIC_BASE_URLS.has(publicBaseUrl.replace(/\/$/, ""))) {
    publicBaseUrl = PRODUCTION_PORTAL_URL;
  }
  const patch: any = {
    id: 1,
    bank_account_holder: nullableValue(formData, "bank_account_holder"),
    iban: nullableValue(formData, "iban"),
    payment_notes: nullableValue(formData, "payment_notes"),
    default_public_base_url: publicBaseUrl,
    updated_at: new Date().toISOString(),
  };
  if (capabilities.bookingUrl) patch.booking_url = nullableValue(formData, "booking_url");
  const { error } = await db().from("portal_settings").upsert(patch, { onConflict: "id" });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function updateProjectStatus(formData: FormData) {
  "use server";

  await requireAdmin();
  const id = value(formData, "id");
  const status = value(formData, "status") as ProjectStatus;
  const statusIdx = projectStatuses.indexOf(status);
  const approvazioneIdx = projectStatuses.indexOf("approvazione_finale");
  // Patch with status + clear fields when moving backwards
  const patch: Record<string, unknown> = {
    status,
    next_action: nextActions[status],
    updated_at: new Date().toISOString(),
    maintenance_active: status === "manutenzione_attiva" ? true : false,
    ...(statusIdx <= approvazioneIdx ? { approved_at: null } : {}),
  };
  const { error } = await db().from("leads").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
  if (status === "manutenzione_attiva") await markChecklist(id, ["maintenance_active"]);
  if (status === "pubblicazione") await markChecklist(id, ["site_published"]);
  // Revalidate client portal too
  const { data: proj } = await db().from("leads").select("slug").eq("id", id).maybeSingle();
  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${id}`);
  if (proj?.slug) revalidatePath(`/p/${proj.slug}`);
}

export async function getAdminAnalytics() {
  await requireAdmin();
  const [projectsRes, paymentsRes, revisionsRes, maintenanceRes, materialsRes, checklistRes] = await Promise.all([
    db().from("leads").select("id,name,company_name,status,created_at,maintenance_active"),
    db().from("payments").select("project_id,type,status,amount"),
    db().from("revision_requests").select("project_id,status,priority,created_at"),
    db().from("maintenance_requests").select("project_id,status,priority,created_at"),
    db().from("project_materials").select("project_id,category,created_at"),
    db().from("project_checklist_items").select("project_id,key,completed"),
  ]);

  const projects = projectsRes.data ?? [];
  const allPayments = paymentsRes.data ?? [];
  const revisions = revisionsRes.data ?? [];
  const maintenance = maintenanceRes.data ?? [];
  const materials = materialsRes.data ?? [];
  const checklistItems = (checklistRes.data ?? []).filter((i: any) => i.key !== "quote_accepted");

  const paymentsByProject = new Map<string, any[]>();
  for (const payment of allPayments) {
    const rows = paymentsByProject.get(payment.project_id) ?? [];
    rows.push(payment);
    paymentsByProject.set(payment.project_id, rows);
  }

  const dedupePayments = (rows: any[]) => {
    const seen = new Set<string>();
    return rows.filter((payment) => {
      const key = `${payment.project_id}-${payment.type}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const payments = dedupePayments(allPayments);
  const countBy = (rows: any[], key: string) =>
    rows.reduce((acc: Record<string, number>, row) => {
      const value = row[key] || "non_impostato";
      acc[value] = (acc[value] ?? 0) + 1;
      return acc;
    }, {});

  const oneTimePayments = payments.filter((payment: any) => payment.type === "acconto" || payment.type === "saldo");
  const maintenancePayments = payments.filter((payment: any) => payment.type === "manutenzione");

  const paidAmount = oneTimePayments
    .filter((payment: any) => payment.status === "pagato")
    .reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);
  const pendingAmount = oneTimePayments
    .filter((payment: any) => payment.status !== "pagato" && payment.amount)
    .reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);

  const mrr = maintenancePayments
    .filter((payment: any) => payment.status === "pagato" && payment.amount)
    .reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);
  const mrrPotential = maintenancePayments
    .filter((payment: any) => payment.amount)
    .reduce((sum: number, payment: any) => sum + Number(payment.amount ?? 0), 0);
  const activeMaintenance = projects.filter((project: any) => {
    const summary = summarizeProjectPayments(paymentsByProject.get(project.id) ?? []);
    return project.maintenance_active || project.status === "manutenzione_attiva" || summary.mrrConfirmed;
  }).length;

  const projectsByStatus = projectStatuses.reduce(
    (acc, status) => {
      acc[status] = [];
      return acc;
    },
    {} as Record<ProjectStatus, Array<{ id: string; name: string; company_name: string | null }>>,
  );
  for (const project of projects) {
    const status = ((project.status || "onboarding") as ProjectStatus);
    projectsByStatus[status]?.push({
      id: project.id,
      name: project.name,
      company_name: project.company_name ?? null,
    });
  }

  const revenueByClient = projects.map((project: any) => {
    const summary = summarizeProjectPayments(paymentsByProject.get(project.id) ?? []);
    return {
      id: project.id,
      name: project.name,
      company_name: project.company_name ?? null,
      status: project.status,
      ...summary,
    };
  });

  // Completion stats
  const completionByProject = projects.map((proj: any) => {
    const items = checklistItems.filter((i: any) => i.project_id === proj.id);
    const total = items.length;
    const done = items.filter((i: any) => i.completed).length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  });
  const avgCompletion = completionByProject.length
    ? Math.round(completionByProject.reduce((a: number, b: number) => a + b, 0) / completionByProject.length)
    : 0;
  const completionBuckets = { "0-25": 0, "26-50": 0, "51-75": 0, "76-100": 0 };
  completionByProject.forEach((pct: number) => {
    if (pct <= 25) completionBuckets["0-25"]++;
    else if (pct <= 50) completionBuckets["26-50"]++;
    else if (pct <= 75) completionBuckets["51-75"]++;
    else completionBuckets["76-100"]++;
  });

  // Average project age in days (creation to now), grouped by status
  const now = Date.now();
  const avgAgeDays = projects.length
    ? Math.round(projects.reduce((sum: number, p: any) => sum + (now - new Date(p.created_at).getTime()) / 86400000, 0) / projects.length)
    : 0;

  return {
    totals: {
      projects: projects.length,
      activeMaintenance,
      openRevisions: revisions.filter((item: any) => item.status !== "completata").length,
      openMaintenance: maintenance.filter((item: any) => item.status !== "completata").length,
      materials: materials.length,
      paidAmount,
      pendingAmount,
      mrr,
      mrrPotential,
      unpaidPayments: payments.filter((payment: any) => payment.status !== "pagato").length,
      avgCompletion,
      avgAgeDays,
    },
    byStatus: countBy(projects, "status"),
    projectsByStatus,
    revenueByClient,
    revisionPriority: countBy(revisions.filter((item: any) => item.status !== "completata"), "priority"),
    maintenancePriority: countBy(maintenance.filter((item: any) => item.status !== "completata"), "priority"),
    materialCategories: countBy(materials, "category"),
    completionBuckets,
  };
}

async function markChecklist(projectId: string, keys: string[]) {
  if (!keys.length) return;
  await db()
    .from("project_checklist_items")
    .update({ completed: true, completed_at: new Date().toISOString() })
    .eq("project_id", projectId)
    .in("key", keys);
}

async function advanceProjectStatus(projectId: string, from: ProjectStatus, to: ProjectStatus) {
  if (projectStatuses.indexOf(to) <= projectStatuses.indexOf(from)) return;
  const { data: project, error: readError } = await db()
    .from("leads")
    .select("status")
    .eq("id", projectId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  const currentStatus = (project?.status || "onboarding") as ProjectStatus;
  if (projectStatuses.indexOf(currentStatus) !== projectStatuses.indexOf(from)) return;
  const { error } = await db()
    .from("leads")
    .update({
      status: to,
      next_action: nextActions[to],
      maintenance_active: to === "manutenzione_attiva" ? true : undefined,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
}
