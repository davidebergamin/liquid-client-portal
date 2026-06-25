import { getPortalProject, getProjectById, updateMaintenanceStatus } from "@/lib/portal";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const dynamic = "force-dynamic";

export default async function ProjectMaintenancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const data = await getPortalProject(projectRow);

  return (
    <section className="space-y-3">
      <h2 className="font-display text-4xl">Richieste manutenzione ({data.maintenanceRequests.length})</h2>
      {data.maintenanceRequests.length ? data.maintenanceRequests.map((request: any) => (
        <form key={request.id} action={updateMaintenanceStatus} className="liquid-card grid gap-4 rounded-xl border border-border p-4 md:grid-cols-[1fr_220px]">
          <input type="hidden" name="id" value={request.id} />
          <input type="hidden" name="project_id" value={data.project.id} />
          <div>
            <p className="font-medium">{request.title}</p>
            <p className="mt-2 text-sm">{request.description}</p>
            <p className="mt-2 text-xs text-muted-foreground">{request.request_type} · priorità {request.priority}</p>
            {request.attachments?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {request.attachments.map((attachment: any) => (
                  <a key={attachment.id} href={attachment.signed_url ?? "#"} target="_blank" rel="noreferrer" className="rounded-md border border-border bg-background px-2 py-1 text-xs transition-colors hover:bg-accent">{attachment.file_name}</a>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Select name="status" defaultValue={request.status}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ricevuta">Ricevuta</SelectItem>
                <SelectItem value="in_lavorazione">In lavorazione</SelectItem>
                <SelectItem value="completata">Completata</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" className="w-full">Aggiorna</Button>
          </div>
        </form>
      )) : <p className="text-sm text-muted-foreground">Nessuna richiesta manutenzione.</p>}
    </section>
  );
}
