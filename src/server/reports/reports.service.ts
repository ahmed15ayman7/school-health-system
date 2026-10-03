import { prisma } from "@/lib/db";
import { clinicFilter } from "@/lib/clinic-scope";
import type { UserRole } from "@prisma/client";
import { isExecutiveRole } from "@/lib/rbac";

export async function getReportsSummary(role: UserRole, clinicId: string | null | undefined) {
  const scope = clinicFilter(role, clinicId);
  const visitWhere = { ...scope, isDeleted: false };
  const [visits, referrals, emergencies, inspections, canteenInspections] = await Promise.all([
    prisma.visit.count({ where: visitWhere }),
    prisma.studentReferral.count({ where: scope.clinicId ? { clinicId: scope.clinicId } : {} }),
    prisma.emergencyCase.count(),
    prisma.safetyInspection.count({ where: scope.clinicId ? { clinicId: scope.clinicId } : {} }),
    prisma.canteenInspection.count(),
  ]);
  const summary = {
    visits,
    referrals,
    emergencies,
    safetyInspections: inspections,
    canteenInspections,
    mode: isExecutiveRole(role) ? "executive" : "operational",
  };
  return summary;
}
