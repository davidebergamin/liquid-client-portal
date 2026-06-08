import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Heart,
  MessageCircle,
  Trash2,
  Upload,
  Loader2,
  Copy,
  Plus,
  Eye,
  ArrowLeft,
  GripVertical,
  Check,
  Pencil,
  X,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  adminListSites,
  addSiteLink,
  createLead,
  deleteLead,
  deleteSite,
  getLeadDetail,
  getLeadUploads,
  listLeads,
  reorderSites,
  updateLead,
  uploadSite,
} from "@/lib/board.functions";

export const Route = createFileRoute("/")({
  component: AdminApp,
});

function AdminApp() {
  const [tab, setTab] = useState<"board" | "leads">("board");
  const [activeLeadSlug, setActiveLeadSlug] = useState<string | null>(null);

  if (activeLeadSlug) {
    return <LeadDetail slug={activeLeadSlug} onBack={() => setActiveLeadSlug(null)} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="px-6 md:px-10 py-8 flex items-center justify-between">
        <span className="font-mono text-sm tracking-widest font-medium">LIQUID</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTab("board")}
            className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 rounded ${tab === "board" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
          >
            Board
          </button>
          <button
            onClick={() => setTab("leads")}
            className={`font-mono text-[11px] uppercase tracking-widest px-3 py-1.5 rounded ${tab === "leads" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}
          >
            Lead
          </button>
        </div>
      </header>

      {tab === "board" ? <BoardTab /> : <LeadsTab onOpen={setActiveLeadSlug} />}
    </div>
  );
}

type AdminSite = {
  id: string;
  title: string | null;
  image_url: string;
  full_image_url: string | null;
  screenshot_status: string | null;
  link_url: string | null;
  width: number | null;
  height: number | null;
  sort_order: number;
  created_at: string;
  likes: number;
  comments: number;
};

function BoardTab() {
  const fetchSites = useServerFn(adminListSites);
  const upload = useServerFn(uploadSite);
  const addLink = useServerFn(addSiteLink);
  // updateSite reserved for future inline edits
  const del = useServerFn(deleteSite);
  const reorder = useServerFn(reorderSites);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sites"],
    queryFn: () => fetchSites(),
  });

  const [order, setOrder] = useState<string[] | null>(null);
  const sites = useMemo<AdminSite[]>(() => {
    if (!data) return [];
    if (!order) return data.sites;
    const map = new Map(data.sites.map((s) => [s.id, s]));
    return order.map((id) => map.get(id)!).filter(Boolean);
  }, [data, order]);

  const dirty = !!order && data && order.some((id, i) => data.sites[i]?.id !== id);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = sites.map((s) => s.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    setOrder(arrayMove(ids, oldIndex, newIndex));
  };

  const reorderMut = useMutation({
    mutationFn: () => reorder({ data: { ids: order! } }),
    onSuccess: () => {
      toast.success("Ordine salvato");
      setOrder(null);
      qc.invalidateQueries({ queryKey: ["admin-sites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const [busy, setBusy] = useState(false);
  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await new Promise<void>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            try {
              const dataUrl = reader.result as string;
              const dims = await readImageDimensions(dataUrl);
              const title = file.name.replace(/\.[^/.]+$/, "").slice(0, 120);
              await upload({ data: { title, fileName: file.name, dataUrl, width: dims.width, height: dims.height } });
              resolve();
            } catch (e) { reject(e); }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }
      toast.success(`${files.length} immagine/i caricate`);
      setOrder(null);
      qc.invalidateQueries({ queryKey: ["admin-sites"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const linkMut = useMutation({
    mutationFn: (url: string) => addLink({ data: { url } }),
    onSuccess: (res) => {
      toast.success("Link aggiunto — sto generando lo screenshot");
      setOrder(null);
      qc.invalidateQueries({ queryKey: ["admin-sites"] });
      const id = res?.site?.id;
      if (id) {
        fetch(`/api/public/capture/sites/${id}`, { method: "POST" })
          .then(() => qc.invalidateQueries({ queryKey: ["admin-sites"] }))
          .catch(() => {});
      }
    },
    onError: (e: Error) => toast.error(e.message),
  });


  // Auto-trigger screenshot capture for any link-site still pending
  useEffect(() => {
    const pending = (data?.sites ?? []).filter(
      (s) => s.screenshot_status === "pending" && s.link_url
    );
    if (!pending.length) return;
    pending.forEach((s) => {
      fetch(`/api/public/capture/sites/${s.id}`, { method: "POST" })
        .then(() => qc.invalidateQueries({ queryKey: ["admin-sites"] }))
        .catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.sites.filter((s) => s.screenshot_status === "pending").map((s) => s.id).join(",")]);

  // Poll while any site is pending
  useEffect(() => {
    const hasPending = (data?.sites ?? []).some((s) => s.screenshot_status === "pending");
    if (!hasPending) return;
    const t = setInterval(() => qc.invalidateQueries({ queryKey: ["admin-sites"] }), 4000);
    return () => clearInterval(t);
  }, [data?.sites, qc]);

  useEffect(() => {
    const isEditable = (el: EventTarget | null) => {
      if (!(el instanceof HTMLElement)) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };
    const onPaste = (e: ClipboardEvent) => {
      if (isEditable(e.target)) return;
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length) {
        e.preventDefault();
        const dt = new DataTransfer();
        files.forEach((f) => dt.items.add(f));
        handleFiles(dt.files);
        return;
      }
      const text = e.clipboardData?.getData("text")?.trim();
      if (text && /^(https?:\/\/|www\.)\S+$/i.test(text)) {
        e.preventDefault();
        linkMut.mutate(text);
      }
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["admin-sites"] });
      const prev = qc.getQueryData<{ sites: AdminSite[] }>(["admin-sites"]);
      if (prev) {
        qc.setQueryData(["admin-sites"], { sites: prev.sites.filter((s) => s.id !== id) });
      }
      return { prev };
    },
    onError: (e: Error, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(["admin-sites"], ctx.prev);
      toast.error(e.message);
    },
    onSuccess: () => {
      toast.success("Eliminato", { duration: 1500 });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin-sites"] });
    },
  });

  return (
    <>
      <section className="px-6 md:px-10 pb-10 max-w-[1600px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">[ 02 ] — Board</p>
        <h1 className="font-display text-5xl md:text-6xl mt-3">Gestisci la mood board</h1>
        <p className="text-muted-foreground mt-3 max-w-xl">
          Trascina le card per riordinarle. L'ordine sarà visibile a tutti i lead.
        </p>

        <label className="mt-8 block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:bg-accent/40 transition">
          <input type="file" accept="image/*" multiple className="hidden" disabled={busy}
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} />
          {busy ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Caricamento in corso...
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="size-6 text-muted-foreground" />
              <p className="font-display text-2xl">Trascina, incolla immagini o link</p>
              <p className="text-xs text-muted-foreground">⌘+V per incollare immagini o un URL. Caricamento multiplo supportato.</p>
            </div>
          )}
        </label>

        {dirty && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-lg border border-border bg-accent/40">
            <span className="text-sm">Hai modificato l'ordine.</span>
            <Button size="sm" onClick={() => reorderMut.mutate()} disabled={reorderMut.isPending}>
              {reorderMut.isPending ? "Salvo..." : "Salva ordine"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setOrder(null)}>Annulla</Button>
          </div>
        )}
      </section>

      <main className="px-6 md:px-10 pb-24 max-w-[1600px] mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : !sites.length ? (
          <p className="text-sm text-muted-foreground text-center py-12">Nessuna immagine ancora.</p>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sites.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="space-y-10 md:space-y-16">

                {sites.map((s, i) => (
                  <SortableSiteCard
                    key={s.id}
                    site={s}
                    index={i}
                    onDelete={() => delMut.mutate(s.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </main>
    </>
  );
}

function SortableSiteCard({
  site,
  index,
  onDelete,
}: {
  site: AdminSite;
  index: number;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: site.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.6 : 1,
  };

  const pending = site.screenshot_status === "pending";
  const host = site.link_url ? (() => { try { return new URL(site.link_url!).hostname.replace(/^www\./, ""); } catch { return null; } })() : null;

  const mediaInner = pending ? (
    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/60 via-muted/30 to-muted/60 animate-pulse">
      <div className="text-center">
        <Loader2 className="size-7 animate-spin mx-auto text-muted-foreground" />
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-3">
          Cattura screenshot...
        </p>
      </div>
    </div>
  ) : (
    <img
      src={site.image_url}
      alt={site.title ?? ""}
      className="absolute inset-0 w-full h-full object-cover object-top block pointer-events-none select-none transition-transform duration-500 ease-out group-hover:scale-[1.02]"
      loading="lazy"
      draggable={false}
    />
  );

  return (
    <article
      ref={setNodeRef}
      style={style}
      className="group relative w-full rounded-2xl overflow-hidden border border-border bg-card transition-shadow duration-300 hover:shadow-2xl"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute top-4 left-4 z-10 rounded-full bg-background/90 backdrop-blur p-2 shadow cursor-grab active:cursor-grabbing hover:bg-background"
        aria-label="Trascina per riordinare"
      >
        <GripVertical className="size-4" />
      </button>

      <div className="relative w-full bg-muted/40 overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
        {site.link_url && !pending ? (
          <a href={site.link_url} target="_blank" rel="noopener noreferrer" className="block absolute inset-0" title={site.link_url}>
            {mediaInner}
          </a>
        ) : (
          mediaInner
        )}
        {host && (
          <div className="absolute bottom-4 left-4 rounded-full bg-background/90 backdrop-blur px-3 py-1.5 flex items-center gap-1.5 shadow-sm pointer-events-none">
            <ExternalLink className="size-3.5" />
            <span className="text-[11px] font-mono uppercase tracking-wider">{host}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">#{index + 1}</p>
          <h3 className="font-display text-2xl md:text-3xl truncate mt-0.5">{site.title || host || "Sito"}</h3>
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
          <span className="inline-flex items-center gap-1"><Heart className="size-4" /> {site.likes}</span>
          <span className="inline-flex items-center gap-1"><MessageCircle className="size-4" /> {site.comments}</span>
          <button
            onClick={onDelete}
            className="text-destructive hover:text-destructive/80 transition"
            aria-label="Elimina"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

function LeadsTab({ onOpen }: { onOpen: (slug: string) => void }) {
  const fetchLeads = useServerFn(listLeads);
  const create = useServerFn(createLead);
  const del = useServerFn(deleteLead);
  const update = useServerFn(updateLead);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => fetchLeads(),
  });

  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const createMut = useMutation({
    mutationFn: () => create({ data: { name: name.trim(), companyName: companyName.trim() || undefined } }),
    onSuccess: () => {
      toast.success("Lead creato");
      setName("");
      setCompanyName("");
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { id } }),
    onSuccess: () => {
      toast.success("Lead eliminato");
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
    },
  });

  const updateMut = useMutation({
    mutationFn: (vars: { id: string; companyName: string }) =>
      update({ data: { id: vars.id, companyName: vars.companyName } }),
    onSuccess: () => {
      toast.success("Aggiornato");
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const publicBaseUrl = "https://liquid-moodboard.lovable.app";
  const linkFor = (slug: string) => `${publicBaseUrl}/b/${slug}`;

  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");

  return (
    <section className="px-6 md:px-10 pb-24 max-w-[1600px] mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">[ 03 ] — Lead</p>
      <h1 className="font-display text-5xl md:text-6xl mt-3">Crea un link per ogni cliente</h1>
      <p className="text-muted-foreground mt-3 max-w-xl">
        Ogni lead ha un link unico. Vede la board partendo da zero like/commenti e tu vedi solo le sue scelte.
        L'azienda è solo per uso interno.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMut.mutate(); }}
        className="mt-8 flex flex-wrap gap-2 max-w-2xl"
      >
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome cliente"
          maxLength={80}
          className="flex-1 min-w-[180px]"
        />
        <Input
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="Azienda (interno)"
          maxLength={120}
          className="flex-1 min-w-[180px]"
        />
        <Button type="submit" disabled={!name.trim() || createMut.isPending}>
          <Plus className="size-4 mr-1" /> Crea
        </Button>
      </form>

      <div className="mt-10 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="size-5 animate-spin text-muted-foreground" /></div>
        ) : !data?.leads.length ? (
          <p className="text-sm text-muted-foreground py-8">Nessun lead ancora.</p>
        ) : (
          data.leads.map((l) => (
            <div key={l.id} className="flex flex-wrap items-center gap-3 p-4 rounded-lg border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="font-display text-xl truncate">{l.name}</p>
                {editing === l.id ? (
                  <div className="flex items-center gap-1 mt-1">
                    <Input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      placeholder="Azienda"
                      maxLength={120}
                      className="h-7 text-xs"
                      autoFocus
                    />
                    <button
                      onClick={() => { updateMut.mutate({ id: l.id, companyName: editValue }); setEditing(null); }}
                      className="text-foreground hover:text-primary p-1"
                    >
                      <Check className="size-3.5" />
                    </button>
                    <button onClick={() => setEditing(null)} className="text-muted-foreground p-1">
                      <X className="size-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setEditing(l.id); setEditValue(l.company_name ?? ""); }}
                    className="font-mono text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 mt-0.5"
                  >
                    {l.company_name || "+ Aggiungi azienda"}
                    <Pencil className="size-2.5 opacity-60" />
                  </button>
                )}
                <p className="font-mono text-[11px] text-muted-foreground truncate mt-0.5">{linkFor(l.slug)}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {l.likes}</span>
                <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> {l.comments}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(linkFor(l.slug));
                  toast.success("Link copiato");
                }}
              >
                <Copy className="size-3.5 mr-1.5" /> Copia link
              </Button>
              <Button size="sm" onClick={() => onOpen(l.slug)}>
                <Eye className="size-3.5 mr-1.5" /> Vedi
              </Button>
              <button
                onClick={() => { if (confirm(`Eliminare ${l.name}? Si perderanno like e commenti.`)) delMut.mutate(l.id); }}
                className="text-destructive hover:text-destructive/80"
                aria-label="Elimina"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function LeadDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const fetchDetail = useServerFn(getLeadDetail);
  const fetchUploads = useServerFn(getLeadUploads);
  const { data, isLoading } = useQuery({
    queryKey: ["lead-detail", slug],
    queryFn: () => fetchDetail({ data: { slug } }),
  });
  const { data: uploads } = useQuery({
    queryKey: ["lead-uploads-admin", slug],
    queryFn: () => fetchUploads({ data: { slug } }),
  });

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="px-6 md:px-10 py-8 flex items-center justify-between">
        <button onClick={onBack} className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Tutti i lead
        </button>
      </header>

      {isLoading || !data ? (
        <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <main className="px-6 md:px-10 pb-24 max-w-[1600px] mx-auto">
          <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">[ Lead ]</p>
          <h1 className="font-display text-5xl md:text-6xl mt-3">{data.lead.name}</h1>
          <p className="text-muted-foreground mt-3">
            {data.sites.filter((s) => s.liked).length} like · {data.sites.reduce((n, s) => n + s.comments.length, 0)} commenti
          </p>

          <div className="mt-12 space-y-4">
            <h2 className="font-display text-3xl">Mi piace</h2>
            <div className="masonry">
              {data.sites.filter((s) => s.liked).map((s) => (
                <div key={s.id} className="rounded-xl overflow-hidden border border-border bg-card">
                  <img src={s.image_url} alt={s.title ?? ""} className="w-full h-auto block" loading="lazy" />
                  <div className="px-4 py-3">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                      {s.title || "Sito"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            {data.sites.every((s) => !s.liked) && (
              <p className="text-sm text-muted-foreground italic">Nessun like ancora.</p>
            )}
          </div>

          <div className="mt-16 space-y-4">
            <h2 className="font-display text-3xl">Commenti</h2>
            {data.sites.filter((s) => s.comments.length > 0).length === 0 && (
              <p className="text-sm text-muted-foreground italic">Nessun commento ancora.</p>
            )}
            <div className="grid md:grid-cols-2 gap-6">
              {data.sites.filter((s) => s.comments.length > 0).map((s) => (
                <div key={s.id} className="rounded-xl overflow-hidden border border-border bg-card">
                  <img src={s.image_url} alt={s.title ?? ""} className="w-full h-48 object-cover" loading="lazy" />
                  <div className="p-4 space-y-3">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                      {s.title || "Sito"}
                    </p>
                    {s.comments.map((c) => (
                      <p key={c.id} className="text-sm border-l-2 border-border pl-3">{c.body}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {uploads?.leadSites && uploads.leadSites.length > 0 && (
            <div className="mt-16 space-y-4">
              <h2 className="font-display text-3xl">Aggiunte dal lead ({uploads.leadSites.length})</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {uploads.leadSites.map((s) => (
                  <div key={s.id} className="rounded-xl overflow-hidden border border-border bg-card">
                    {s.image_url ? (
                      <img src={s.image_url} alt={s.title ?? ""} className="w-full h-auto block" loading="lazy" />
                    ) : (
                      <a
                        href={s.link_url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-[16/10] bg-accent flex items-center justify-center p-6 text-center hover:bg-accent/70"
                      >
                        <div>
                          <ExternalLink className="size-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="font-display text-xl break-all">{s.title || s.link_url}</p>
                        </div>
                      </a>
                    )}
                    <div className="p-4 space-y-2">
                      {s.title && <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground truncate">{s.title}</p>}
                      {s.link_url && (
                        <a href={s.link_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 break-all hover:underline">
                          <ExternalLink className="size-3" /> {s.link_url}
                        </a>
                      )}
                      {s.comments.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-border">
                          {s.comments.map((c) => (
                            <p key={c.id} className="text-sm border-l-2 border-border pl-3">{c.body}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

function readImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Impossibile leggere l'immagine"));
    img.src = dataUrl;
  });
}
