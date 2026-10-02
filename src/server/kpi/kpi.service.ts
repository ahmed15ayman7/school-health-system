import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { clinicFilter } from "@/lib/clinic-scope";

export type KpiRow = { key: string; label: string; value: number; target: number; status: "ok" | "warn" | "bad" };

export async function getKpis(role: UserRole, clinicId: string | null | undefined): Promise<KpiRow[]> {
  const scope = clinicFilter(role, clinicId);
  const completed = await prisma.studentReferral.findMany({
    where: { ...scope, status: "COMPLETED", waitingMinutes: { not: null } },
    select: { waitingMinutes: true, treatmentMinutes: true },
    take: 500,
  });
  const avgWait =
    completed.length > 0
      ? completed.reduce((s, r) => s + (r.waitingMinutes ?? 0), 0) / completed.length
      : 0;
  const avgTreat =
    completed.length > 0
      ? completed.reduce((s, r) => s + (r.treatmentMinutes ?? 0), 0) / completed.length
      : 0;

  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);
  const visits = await prisma.visit.count({
    where: { ...scope, dateTime: { gte: monthAgo }, isDeleted: false },
  });
  const externalRefs = await prisma.referral.count({
    where: { visit: { ...scope, dateTime: { gte: monthAgo } } },
  });
  const extRate = visits > 0 ? (externalRefs / visits) * 100 : 0;

  const mk = (key: string, label: string, value: number, target: number, lowerBetter: boolean): KpiRow => {
    let status: KpiRow["status"] = "ok";
    if (lowerBetter ? value > target * 1.1 : value < target * 0.9) status = "bad";
    else if (lowerBetter ? value > target : value < target) status = "warn";
    return { key, label, value: Math.round(value * 10) / 10, target, status };
  };

  return [
    mk("avgWait", "متوسط انتظار التحويل (د)", avgWait, 10, true),
    mk("avgTreat", "متوسط العلاج (د)", avgTreat, 20, true),
    mk("extRate", "نسبة الإحالات الخارجية %", extRate, 5, true),
  ];
}
