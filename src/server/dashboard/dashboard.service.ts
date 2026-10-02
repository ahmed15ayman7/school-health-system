import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { clinicFilter } from "@/lib/clinic-scope";

export async function getExecutiveDashboardCounts(role: UserRole, clinicId: string | null | undefined) {
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

  return { visitsToday, emergencies, pendingReferrals, lowStock };
}
