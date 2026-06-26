import { redirect } from "next/navigation";

export default async function LegacyMaterialsRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/admin/projects/${id}/contenuti`);
}
