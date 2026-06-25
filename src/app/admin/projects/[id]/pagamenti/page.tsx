import { getPortalProject, getProjectById, updatePaymentQuick } from "@/lib/portal";
import { PaymentsTable } from "@/components/PaymentsTable";

export const dynamic = "force-dynamic";

export default async function ProjectPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectRow = await getProjectById(id);
  if (!projectRow) return null;
  const data = await getPortalProject(projectRow);

  const seen = new Set<string>();
  const uniquePayments = data.payments.filter((p: any) => {
    if (seen.has(p.type)) return false;
    seen.add(p.type);
    return true;
  });

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Le modifiche vengono salvate automaticamente. Spunta &ldquo;Pagamento confermato&rdquo; quando ricevi il pagamento.
      </p>
      <PaymentsTable projectId={data.project.id} payments={uniquePayments} action={updatePaymentQuick} />
    </div>
  );
}
