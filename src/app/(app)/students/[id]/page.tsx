import { MedicalAlertBanner } from "@/components/shared/MedicalAlertBanner";
import { auth } from "@/lib/auth";
import { getStudentForProfile } from "@/server/students/students.service";
import { rowAvatarSrc } from "@/lib/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const data = await getStudentForProfile(
    {
      userId: session!.user.id,
      role: session!.user.role,
      clinicId: session!.user.clinicId,
      fullName: session!.user.name ?? "",
      username: session!.user.username ?? "",
    },
    id,
  );
  if (!data) notFound();
  const { student, profile, alerts } = data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={rowAvatarSrc({ ...student, id: student.id }, "students")}
            alt=""
            className="h-16 w-16 rounded-full border-2 border-white object-cover shadow-md ring-2 ring-accent/20"
          />
          <div>
            <h2 className="text-xl font-black text-primary">{student.name}</h2>
            <p className="text-sm font-bold text-muted">
              {student.academicNumber} — {student.grade} / {student.class}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/students/${id}/history`}>
            <Button variant="outline" size="sm">
              السجل المرضي
            </Button>
          </Link>
          <Link href={`/visits/new?studentId=${id}`}>
            <Button size="sm">تسجيل زيارة</Button>
          </Link>
        </div>
      </div>
      <MedicalAlertBanner alerts={alerts} />
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 font-black text-primary">ولي الأمر</h3>
          <p className="text-sm font-bold">{student.guardianName}</p>
          <p className="text-sm text-muted">{student.guardianPhone}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="mb-2 font-black text-primary">ملخص صحي</h3>
          <p className="text-sm">فصيلة الدم: {profile?.bloodType ?? student.bloodType ?? "—"}</p>
          <p className="text-sm">حساسيات: {profile?.allergies.length ?? 0}</p>
          <p className="text-sm">أمراض مزمنة: {profile?.chronicConditions.length ?? 0}</p>
        </div>
      </div>
    </div>
  );
}
