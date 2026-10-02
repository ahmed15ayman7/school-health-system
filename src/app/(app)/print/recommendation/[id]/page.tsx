import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function RecommendationPrintPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rec = await prisma.medicalRecommendation.findUnique({
    where: { id },
    include: { employee: true },
  });
  if (!rec) notFound();

  return (
    <div className="print-area mx-auto max-w-2xl space-y-4 p-8 font-sans">
      <h1 className="text-center text-lg font-black">توصية طبية — HR</h1>
      <p>الموظف: {rec.employee.name}</p>
      <p>التاريخ: {rec.recommendedAt.toLocaleDateString("ar-QA")}</p>
      <p>نوع التوصية: {rec.recommendationType}</p>
      <p>مدة الراحة: {rec.restDurationHours?.toString() ?? "—"} ساعة</p>
      <p className="text-xs text-muted">(بدون سرد سريري — FR-021)</p>
    </div>
  );
}
