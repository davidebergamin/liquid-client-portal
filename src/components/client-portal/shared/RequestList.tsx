import { Badge } from "@/components/ui/badge";

export function RequestList({ items, empty }: { items: any[]; empty: string }) {
  if (!items.length) return <p className="text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">Richieste inviate</p>
      {items.map((item) => (
        <div key={item.id} className="rounded-xl border border-border bg-background p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{item.title || item.page}</p>
            <Badge variant={item.status === "completata" ? "default" : "outline"} className="text-[10px]">{item.status}</Badge>
            <Badge variant="outline" className="text-[10px]">{item.priority}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{item.description || item.comment}</p>
          {item.attachments?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.attachments.map((att: any) => (
                <a key={att.id} href={att.signed_url ?? "#"} target="_blank" rel="noreferrer" className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">{att.file_name}</a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
