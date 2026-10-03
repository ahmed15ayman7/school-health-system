import { StatCard } from "@/components/shared/StatCard";
import { auth } from "@/lib/auth";
import { getExecutiveDashboardCounts } from "@/server/dashboard/dashboard.service";
import { getVisitsLast7Days } from "@/server/dashboard/charts.service";
import { getKpis } from "@/server/kpi/kpi.service";
import { ExecutiveCharts } from "@/components/shared/ExecutiveCharts";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { can, isExecutiveRole } from "@/lib/rbac";

export default async function ExecutiveDashboard() {
  const session = await auth();
  const role = session!.user.role;
  const executive = isExecutiveRole(role);
  const canCreateVisit = can(role, "visits", "create");
  const clinicId = session!.user.clinicId;
  const [{ visitsToday, emergencies, pendingReferrals, lowStock }, visitsByDay, kpis] =
    await Promise.all([
      getExecutiveDashboardCounts(role, clinicId),
      getVisitsLast7Days(role, clinicId),
      getKpis(role, clinicId),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-primary">
            {executive ? "لوحة القيادة — مؤشرات مجمّعة" : "لوحة المؤشرات التنفيذية"}
          </h2>
          <p className="text-sm font-bold text-muted">
            {executive ? "بدون تفاصيل طبية أو نفسية حساسة" : "مؤشرات حية لليوم"}
          </p>
        </div>
        {canCreateVisit && (
          <Link href="/visits/new">
            <Button>+ زيارة جديدة</Button>
          </Link>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="زيارات اليوم" value={visitsToday} icon="🩺" tone="teal" />
        <StatCard label="حالات طارئة" value={emergencies} icon="🚨" tone="red" />
        <StatCard label="تحويلات قيد الانتظار" value={pendingReferrals} icon="⏳" tone="orange" />
        <StatCard label="تنبيهات مخزون" value={lowStock} icon="💊" tone="blue" />
      </div>
      {!executive && <ExecutiveCharts visitsByDay={visitsByDay} />}
      {!executive && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 font-black text-primary">مؤشرات FR-122</h3>
          <div className="flex flex-wrap gap-2">
            {kpis.map((k) => (
              <Badge key={k.key} tone={k.status === "ok" ? "green" : k.status === "warn" ? "yellow" : "red"}>
                {k.label}: {k.value} (هدف {k.target})
              </Badge>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 font-black text-primary">اختصارات</h3>
        <div className="flex flex-wrap gap-2">
          {can(role, "student_referrals", "create") && (
            <Link href="/referrals/new">
              <Button size="sm" variant="outline">
                تحويل طالب
              </Button>
            </Link>
          )}
          {can(role, "emergency", "create") && (
            <Link href="/emergency/new">
              <Button size="sm" variant="danger">
                طوارئ
              </Button>
            </Link>
          )}
          {can(role, "reports", "read") && (
            <Link href="/reports">
              <Button size="sm" variant="outline">
                تقارير
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
