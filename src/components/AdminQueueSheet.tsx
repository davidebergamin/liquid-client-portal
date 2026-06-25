"use client";

import Link from "next/link";
import { Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type QueueItem = {
  id: string;
  queue_type: string;
  title?: string | null;
  page?: string | null;
  section?: string | null;
  description?: string | null;
  comment?: string | null;
  status?: string | null;
  priority?: string | null;
  project?: { id: string; name?: string | null; company_name?: string | null } | null;
};

export function AdminQueueSheet({ items }: { items: QueueItem[] }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Inbox className="size-4" />
          Coda operativa
          {items.length > 0 && (
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {items.length}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-display text-3xl">Da gestire</SheetTitle>
          <SheetDescription>Revisioni, pagamenti e manutenzioni in attesa.</SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          {items.length ? items.map((item) => {
            const typeColor = item.queue_type === "payment"
              ? "border-l-amber-400"
              : item.queue_type === "maintenance"
              ? "border-l-blue-400"
              : "border-l-violet-400";
            const typeLabel = item.queue_type === "payment" ? "Pagamento" : item.queue_type === "maintenance" ? "Manutenzione" : "Revisione";
            return (
              <article key={`${item.queue_type}-${item.id}`} className={`rounded-lg border border-border border-l-[3px] bg-background p-3.5 ${typeColor}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {typeLabel}{item.priority ? ` · ${item.priority}` : ""}
                  </p>
                  <Badge variant="outline" className="text-[10px]">
                    {item.status === "da_pagare" ? "In verifica" : item.status}
                  </Badge>
                </div>
                <h3 className="mt-1.5 font-medium">{item.title || item.page}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.project?.company_name || item.project?.name || "Progetto"}
                  {item.section ? ` · ${item.section}` : ""}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                  {item.queue_type === "payment"
                    ? "Cliente: pagamento effettuato, in attesa di verifica."
                    : item.description || item.comment}
                </p>
                {item.project && (
                  <Button asChild size="sm" variant="outline" className="mt-3">
                    <Link href={`/admin/projects/${item.project.id}`}>Apri progetto</Link>
                  </Button>
                )}
              </article>
            );
          }) : (
            <div className="rounded-lg border border-dashed border-border py-12 text-center">
              <p className="text-sm text-muted-foreground">Nessuna richiesta aperta</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
