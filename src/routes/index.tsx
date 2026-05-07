import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">LIQUID</p>
        <h1 className="font-display text-5xl mt-6 leading-[0.95]">Mood board personale</h1>
        <p className="text-muted-foreground mt-6 leading-relaxed">
          La tua selezione è privata e accessibile tramite un link unico. Se non hai ricevuto il link,
          contatta chi ti ha invitato.
        </p>
      </div>
    </div>
  );
}
