import { StatCard } from "@/components/shared/StatCard";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { clinicFilter } from "@/lib/clinic-scope";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ExecutiveDashboard() {
  const session = await auth();
  const role = session!.user.role;
  const clinicId = session!.user.clinicId;
  const scope = clinicFilter(role, clinicId);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [visitsToday, emergencies, pendingReferrals, lowStock] = await Promise.all([
    prisma.visit.count({ where: { ...scope, dateTime: { gte: todayStart }, isDeleted: false } }),
    prisma.emergencyCase.count({ where: { eventTime: { gte: todayStart } } }),
    prisma.studentReferral.count({ where: { ...scope, status: "PENDING" } }),
    prisma.medicationBatch.count({
      where: {
        quantity: { lte: 5 },
        medication: scope.clinicId ? { clinicId: scope.clinicId } : undefined,
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-primary">لوحة المؤشرات التنفيذية</h2>
          <p className="text-sm font-bold text-muted">مؤشرات حية لليوم</p>
        </div>
        <Link href="/visits/new">
          <Button>+ زيارة جديدة</Button>
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="زيارات اليوم" value={visitsToday} icon="🩺" tone="teal" />
        <StatCard label="حالات طارئة" value={emergencies} icon="🚨" tone="red" />
        <StatCard label="تحويلات قيد الانتظار" value={pendingReferrals} icon="⏳" tone="orange" />
        <StatCard label="تنبيهات مخزون" value={lowStock} icon="💊" tone="blue" />
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-black text-primary">اختصارات سريعة (≤3 نقرات)</h3>
        <div className="flex flex-wrap gap-2">
          <Link href="/referrals/new"><Button size="sm" variant="outline">تحويل طالب</Button></Link>
          <Link href="/emergency/new"><Button size="sm" variant="danger">طوارئ</Button></Link>
          <Link href="/medications"><Button size="sm" variant="outline">MAR / أدوية</Button></Link>
          <Link href="/reports"><Button size="sm" variant="outline">تقارير</Button></Link>
        </div>
      </div>
    </div>
  );
}
