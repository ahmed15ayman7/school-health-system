import type { UserRole } from "@prisma/client";
import { CENTRAL_ROLES } from "@/lib/rbac";

export function assertClinicAccess(
  role: UserRole,
  userClinicId: string | null | undefined,
  targetClinicId: string | null | undefined,
) {
  if (CENTRAL_ROLES.includes(role)) return;
  if (!userClinicId || !targetClinicId || userClinicId !== targetClinicId) {
    throw new Error("CLINIC_FORBIDDEN");
  }
}

export function clinicFilter(role: UserRole, clinicId: string | null | undefined) {
  if (CENTRAL_ROLES.includes(role) || !clinicId) return {};
  return { clinicId };
}
