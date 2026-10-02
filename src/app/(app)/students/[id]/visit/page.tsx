import { redirect } from "next/navigation";

export default async function StudentVisitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/visits/new?studentId=${id}`);
}
