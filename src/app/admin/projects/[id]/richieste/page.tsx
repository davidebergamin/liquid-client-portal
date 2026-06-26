import {
  CheckCircle2,
  CreditCard,
  FileText,
  Heart,
  Link2,
  MessageSquare,
  Palette,
  RefreshCw,
  Receipt,
  Sparkles,
  Wrench,
} from "lucide-react";
import { MaintenanceToggle } from "@/components/MaintenanceToggle";
import { RevisionToggle } from "@/components/RevisionToggle";
import {
  getClientActivity,
  getPortalProject,
  getProjectById,
  updateMaintenanceStatus,
  updateRevisionStatus,
} from "@/lib/portal";

export const dynamic = "force-dynamic";

const icons: Record<string, React.ReactNode> = {
  revision: <RefreshCw className="size-4" />,
  maintenance: <Wrench className="size-4" />,
  material: <FileText className="size-4" />,
  payment: <CreditCard className="size-4" />,
  like: <Heart className="size-4" />,
  comment: <MessageSquare className="size-4" />,
  inspiration: <Link2 className="size-4" />,
  brief: <Sparkles className="size-4" />,
  invoice: <Receipt className="size-4" />,
  direction: <Palette className="size-4" />,
  approval: <CheckCircle2 className="size-4" />,
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function ProjectRequestsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const [data, events] = await Promise.all([getPortalProject(projectRow), getClientActivity(id)]);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <div>
          <h2 className="font-display text-4xl">Revisioni bozza ({data.revisionRequests.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">Spunta per segnare completata.</p>
        </div>
        {data.revisionRequests.length ? (
          data.revisionRequests.map((request: any) => (
            <RevisionToggle
              key={`${request.id}-${request.status}`}
              id={request.id}
              projectId={data.project.id}
              page={request.page}
              section={request.section}
              comment={request.comment}
              priority={request.priority}
              status={request.status}
              action={updateRevisionStatus}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nessuna richiesta revisione.</p>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="font-display text-4xl">Manutenzione ({data.maintenanceRequests.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.maintenanceRequests.filter((item: any) => item.status !== "completata").length
              ? `${data.maintenanceRequests.filter((item: any) => item.status !== "completata").length} aperte`
              : "Tutto gestito"}
          </p>
        </div>
        {data.maintenanceRequests.length ? (
          data.maintenanceRequests.map((request: any) => (
            <MaintenanceToggle
              key={`${request.id}-${request.status}`}
              id={request.id}
              projectId={data.project.id}
              title={request.title}
              description={request.description}
              requestType={request.request_type}
              priority={request.priority}
              status={request.status}
              attachments={request.attachments}
              action={updateMaintenanceStatus}
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Nessuna richiesta manutenzione.</p>
        )}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-display text-4xl">Attività cliente ({events.length})</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cronologia di tutto quello che ha fatto nel portale.</p>
        </div>
        {events.length ? (
          <ol className="relative space-y-1 border-l border-border pl-6">
            {events.map((event) => (
              <li key={event.id} className="relative pb-5">
                <span className="absolute -left-[31px] grid size-6 place-items-center rounded-full border border-border bg-background text-primary">
                  {icons[event.type] ?? <CheckCircle2 className="size-4" />}
                </span>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-medium">{event.label}</p>
                  <time className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                    {formatDate(event.at)}
                  </time>
                </div>
                {event.detail && (
                  <p className="mt-1 break-words text-sm text-muted-foreground">{event.detail}</p>
                )}
              </li>
            ))}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">Nessuna azione registrata dal cliente.</p>
        )}
      </section>
    </div>
  );
}
