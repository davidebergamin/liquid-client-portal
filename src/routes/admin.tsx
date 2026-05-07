import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Heart, MessageCircle, Trash2, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import { deleteSite, listSites, uploadSite, verifyAdmin } from "@/lib/board.functions";

export const Route = createFileRoute("/admin")({
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
    onSuccess: () => {
      sessionStorage.setItem(PW_KEY, pw);
      setAuthed(true);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <Toaster richColors position="top-center" />
        <div className="w-full max-w-sm">
          <Link to="/" className="font-mono text-sm tracking-widest font-medium">LIQUID</Link>
          <h1 className="font-display text-4xl mt-6">Admin</h1>
          <p className="text-sm text-muted-foreground mt-2">Inserisci la password per gestire la board.</p>
          <form
            onSubmit={(e) => { e.preventDefault(); loginMut.mutate(); }}
            className="mt-6 space-y-3"
          >
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="Password"
              autoFocus
            />
            <Button type="submit" className="w-full" disabled={loginMut.isPending || !pw}>
              {loginMut.isPending ? "Verifico..." : "Entra"}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return <AdminBoard password={pw} />;
}

function AdminBoard({ password }: { password: string }) {
  const fetchSites = useServerFn(listSites);
  const upload = useServerFn(uploadSite);
  const del = useServerFn(deleteSite);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["sites"],
    queryFn: () => fetchSites(),
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
              await upload({
                data: {
                  password,
                  title,
                  fileName: file.name,
                  dataUrl,
                  width: dims.width,
                  height: dims.height,
                },
              });
              resolve();
            } catch (e) { reject(e); }
          };
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });
      }
      toast.success(`${files.length} immagine/i caricate`);
      qc.invalidateQueries({ queryKey: ["sites"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const delMut = useMutation({
    mutationFn: (id: string) => del({ data: { password, id } }),
    onSuccess: () => {
      toast.success("Eliminato");
      qc.invalidateQueries({ queryKey: ["sites"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background">
      <Toaster richColors position="top-center" />
      <header className="px-6 md:px-10 py-8 flex items-center justify-between">
        <Link to="/" className="font-mono text-sm tracking-widest font-medium">LIQUID</Link>
        <span className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Admin</span>
      </header>

      <section className="px-6 md:px-10 pb-10 max-w-[1600px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">[ 02 ] — Board</p>
        <h1 className="font-display text-5xl md:text-6xl mt-3">Gestisci la mood board</h1>

        <label className="mt-8 block border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:bg-accent/40 transition">
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={busy}
            onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }}
          />
          {busy ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Caricamento in corso...
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="size-6 text-muted-foreground" />
              <p className="font-display text-2xl">Trascina o seleziona immagini</p>
              <p className="text-xs text-muted-foreground">PNG, JPG, WebP — caricamento multiplo supportato</p>
            </div>
          )}
        </label>
      </section>

      <main className="px-6 md:px-10 pb-24 max-w-[1600px] mx-auto">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
        ) : !data?.sites.length ? (
          <p className="text-sm text-muted-foreground text-center py-12">Nessuna immagine ancora.</p>
        ) : (
          <div className="masonry">
            {data.sites.map((s) => (
              <div key={s.id} className="group relative rounded-xl overflow-hidden border border-border bg-card">
                <img src={s.image_url} alt={s.title ?? ""} className="w-full h-auto block" loading="lazy" />
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground truncate">
                    {s.title || "Sito"}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
                    <span className="inline-flex items-center gap-1"><Heart className="size-3.5" /> {s.likes}</span>
                    <span className="inline-flex items-center gap-1"><MessageCircle className="size-3.5" /> {s.comments}</span>
                    <button
                      onClick={() => {
                        if (confirm("Eliminare questo sito?")) delMut.mutate(s.id);
                      }}
                      className="text-destructive hover:text-destructive/80 transition"
                      aria-label="Elimina"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
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
