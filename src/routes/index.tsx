import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Heart,
  MessageCircle,
  Trash2,
  Upload,
  Loader2,
  ArrowUp,
  ArrowDown,
  Copy,
  Plus,
  Eye,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  adminListSites,
  createLead,
  deleteLead,
  deleteSite,
  getLeadDetail,
  listLeads,
  reorderSites,
  uploadSite,
  verifyAdmin,
} from "@/lib/board.functions";

export const Route = createFileRoute("/")({
  component: AdminPage,
});

const PW_KEY = "liquid_admin_pw";

function AdminPage() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const verify = useServerFn(verifyAdmin);

  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) {
      verify({ data: { password: saved } })
        .then(() => { setPw(saved); setAuthed(true); })
        .catch(() => sessionStorage.removeItem(PW_KEY));
    }
  }, [verify]);

  const loginMut = useMutation({
    mutationFn: () => verify({ data: { password: pw } }),
    onSuccess: () => { sessionStorage.setItem(PW_KEY, pw); setAuthed(true); },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Toaster richColors position="top-center" />
        <div className="w-full max-w-sm">
          <span className="font-mono text-sm tracking-widest font-medium">LIQUID</span>
          <h1 className="font-display text-4xl mt-6">Admin</h1>
          <p className="text-sm text-muted-foreground mt-2">Inserisci la password per gestire la board.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); loginMut.mutate(); }}
            className="mt-6 space-y-3"
          >
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" autoFocus />
            <Button type="submit" className="w-full" disabled={loginMut.isPending || !pw}>
              {loginMut.isPending ? "Verifico..." : "Entra"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminApp password={pw} />;
}

function AdminApp({ password }: { password: string }) {
  const [tab, setTab] = useState<"board" | "leads">("board");
  const [activeLeadSlug, setActiveLeadSlug] = useState<string | null>(null);

  if (activeLeadSlug) {
    return <LeadDetail password={password} slug={activeLeadSlug} onBack={() => setActiveLeadSlug(null)} />;
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

      {tab === "board" ? <BoardTab password={password} /> : <LeadsTab password={password} onOpen={setActiveLeadSlug} />}
    </div>
  );
}

function BoardTab({ password }: { password: string }) {
  const fetchSites = useServerFn(adminListSites);
  const upload = useServerFn(uploadSite);
  const del = useServerFn(deleteSite);
  const reorder = useServerFn(reorderSites);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sites"],
    queryFn: () => fetchSites({ data: { password } }),
  });

  const [order, setOrder] = useState<string[] | null>(null);
  const sites = useMemo(() => {
    if (!data) return [];
    if (!order) return data.sites;
    const map = new Map(data.sites.map((s) => [s.id, s]));
    return order.map((id) => map.get(id)!).filter(Boolean);
  }, [data, order]);

  const dirty = !!order && data && order.some((id, i) => data.sites[i]?.id !== id);

  const move = (id: string, dir: -1 | 1) => {
    const ids = sites.map((s) => s.id);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    setOrder(ids);
  };

  const reorderMut = useMutation({
    mutationFn: () => reorder({ data: { password, ids: order! } }),
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
              await upload({ data: { password, title, fileName: file.name, dataUrl, width: dims.width, height: dims.height } });
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

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of Array.from(items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (!files.length) return;
      e.preventDefault();
      const dt = new DataTransfer();
      files.forEach((f) => dt.items.add(f));
      handleFiles(dt.files);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { password, id } }),
    onSuccess: () => {
      toast.success("Eliminato");
      setOrder(null);
      qc.invalidateQueries({ queryKey: ["admin-sites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <section className="px-6 md:px-10 pb-10 max-w-[1600px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">[ 02 ] — Board</p>
        <h1 className="font-display text-5xl md:text-6xl mt-3">Gestisci la mood board</h1>

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
              <p className="font-display text-2xl">Trascina, incolla o seleziona immagini</p>
              <p className="text-xs text-muted-foreground">⌘+V per incollare. Caricamento multiplo supportato.</p>
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
          <div className="masonry">
            {sites.map((s, i) => (
              <div key={s.id} className="group relative rounded-xl overflow-hidden border border-border bg-card">
                <img src={s.image_url} alt={s.title ?? ""} className="w-full h-auto block" loading="lazy" />
                <div className="absolute top-2 left-2 flex gap-1">
                  <button onClick={() => move(s.id, -1)} disabled={i === 0}
                    className="rounded-md bg-background/90 backdrop-blur p-1.5 shadow disabled:opacity-30 hover:bg-background">
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button onClick={() => move(s.id, 1)} disabled={i === sites.length - 1}
                    className="rounded-md bg-background/90 backdrop-blur p-1.5 shadow disabled:opacity-30 hover:bg-background">
                    <ArrowDown className="size-3.5" />
                  </button>
                </div>
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                    #{i + 1} · {s.title || "Sito"}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {s.likes}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> {s.comments}</span>
                    <button
                      onClick={() => { if (confirm("Eliminare questo sito?")) delMut.mutate(s.id); }}
                      className="text-destructive hover:text-destructive/80 transition" aria-label="Elimina">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function LeadsTab({ password, onOpen }: { password: string; onOpen: (slug: string) => void }) {
  const fetchLeads = useServerFn(listLeads);
  const create = useServerFn(createLead);
  const del = useServerFn(deleteLead);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: () => fetchLeads({ data: { password } }),
  });

  const [name, setName] = useState("");
  const createMut = useMutation({
    mutationFn: () => create({ data: { password, name: name.trim() } }),
    onSuccess: () => {
      toast.success("Lead creato");
      setName("");
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { password, id } }),
    onSuccess: () => {
      toast.success("Lead eliminato");
      qc.invalidateQueries({ queryKey: ["admin-leads"] });
    },
  });

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const linkFor = (slug: string) => `${baseUrl}/b/${slug}`;

  return (
    <section className="px-6 md:px-10 pb-24 max-w-[1600px] mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">[ 03 ] — Lead</p>
      <h1 className="font-display text-5xl md:text-6xl mt-3">Crea un link per ogni cliente</h1>
      <p className="text-muted-foreground mt-3 max-w-xl">
        Ogni lead ha un link unico. Vede la board partendo da zero like/commenti e tu vedi solo le sue scelte.
      </p>

      <form
        onSubmit={(e) => { e.preventDefault(); if (name.trim()) createMut.mutate(); }}
        className="mt-8 flex gap-2 max-w-md"
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome del cliente" maxLength={80} />
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
                <p className="font-mono text-[11px] text-muted-foreground truncate">{linkFor(l.slug)}</p>
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

function LeadDetail({ password, slug, onBack }: { password: string; slug: string; onBack: () => void }) {
  const fetchDetail = useServerFn(getLeadDetail);
  const { data, isLoading } = useQuery({
    queryKey: ["lead-detail", slug],
    queryFn: () => fetchDetail({ data: { password, slug } }),
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
