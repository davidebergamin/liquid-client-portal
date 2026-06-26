import { redirect } from "next/navigation";

export default async function LegacyMaintenanceRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/projects/${id}/richieste`);
}
