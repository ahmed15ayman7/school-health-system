import { auth } from "@/lib/auth";
import { MedicalTimeline } from "@/components/shared/MedicalTimeline";
import { getStudentHistory } from "@/server/health/history.service";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function StudentHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const events = await getStudentHistory(
    {
      userId: session!.user.id,
      role: session!.user.role,
      clinicId: session!.user.clinicId,
      fullName: session!.user.name ?? "",
      username: session!.user.username ?? "",
    },
    id,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-xl font-black text-primary">السجل المرضي</h2>
        <Link href={`/students/${id}`}>
          <Button size="sm" variant="outline">
            رجوع للملف
          </Button>
        </Link>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <MedicalTimeline events={events} />
      </div>
    </div>
  );
}
