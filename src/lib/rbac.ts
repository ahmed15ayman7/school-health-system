import type { UserRole } from "@prisma/client";

export type Resource =
  | "students"
  | "employees"
  | "health_profiles"
  | "visits"
  | "student_referrals"
  | "emergency"
  | "medications"
  | "mar"
  | "inventory"
  | "canteen"
  | "nursing"
  | "safety"
  | "circulars"
  | "reports"
  | "psychology"
  | "social"
  | "internal_referrals"
  | "settings"
  | "audit_logs"
  | "recommendations";

export type Action = "create" | "read" | "update" | "delete" | "export" | "approve";

const ALL: Action[] = ["create", "read", "update", "delete", "export", "approve"];

const matrix: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  SUPER_ADMIN: Object.fromEntries(
    (
      [
        "students",
        "employees",
        "health_profiles",
        "visits",
        "student_referrals",
        "emergency",
        "medications",
        "mar",
        "inventory",
        "canteen",
        "nursing",
        "safety",
        "circulars",
        "reports",
        "psychology",
        "social",
        "internal_referrals",
        "settings",
        "audit_logs",
        "recommendations",
      ] as Resource[]
    ).map((r) => [r, ALL]),
  ) as Partial<Record<Resource, Action[]>>,
  EXECUTIVE: {
    reports: ["read", "export"],
    circulars: ["read"],
    settings: ["read"],
    emergency: ["read"],
    student_referrals: ["read"],
    visits: ["read"],
  },
  MEDICAL_MANAGER: {
    students: ["create", "read", "update", "export"],
    employees: ["create", "read", "update", "export"],
    health_profiles: ["create", "read", "update", "export"],
    visits: ["create", "read", "update", "export"],
    student_referrals: ["create", "read", "update", "export"],
    emergency: ["create", "read", "update", "export"],
    medications: ["create", "read", "update", "export"],
    mar: ["read", "export"],
    inventory: ["create", "read", "update", "export"],
    canteen: ["read", "export"],
    nursing: ["read", "update", "export"],
    safety: ["read", "update", "export"],
    circulars: ["create", "read", "update", "export"],
    reports: ["read", "export"],
    psychology: ["read", "export"],
    social: ["read", "export"],
    internal_referrals: ["create", "read", "update"],
    recommendations: ["create", "read", "update", "export"],
  },
  EHS_OFFICER: {
    safety: ["create", "read", "update", "export"],
    canteen: ["create", "read", "update", "export"],
    reports: ["read", "export"],
    circulars: ["read"],
    inventory: ["read"],
  },
  HEAD_NURSE: {
    students: ["read", "update"],
    employees: ["read"],
    health_profiles: ["create", "read", "update"],
    visits: ["create", "read", "update"],
    student_referrals: ["create", "read", "update"],
    emergency: ["create", "read", "update"],
    medications: ["read"],
    mar: ["create", "read"],
    inventory: ["read", "update", "approve"],
    canteen: ["read"],
    nursing: ["create", "read", "update"],
    safety: ["read", "update"],
    circulars: ["read"],
    reports: ["read", "export"],
    internal_referrals: ["create", "read"],
    recommendations: ["create", "read", "update"],
  },
  NURSE: {
    students: ["read"],
    employees: ["read"],
    health_profiles: ["read", "update"],
    visits: ["create", "read", "update"],
    student_referrals: ["create", "read", "update"],
    emergency: ["create", "read", "update"],
    medications: ["read"],
    mar: ["create", "read"],
    inventory: ["read"],
    canteen: ["read"],
    nursing: ["read"],
    safety: ["read"],
    circulars: ["read"],
    reports: ["read"],
    internal_referrals: ["create", "read"],
    recommendations: ["create", "read"],
  },
  PHARMACY: {
    medications: ["create", "read", "update", "delete"],
    mar: ["read"],
    inventory: ["create", "read", "update", "delete"],
    reports: ["read", "export"],
  },
  CANTEEN_INSPECTOR: {
    canteen: ["create", "read", "update", "export"],
    reports: ["read", "export"],
  },
  HR: {
    employees: ["read"],
    recommendations: ["read", "approve"],
    reports: ["read", "export"],
  },
  SCHOOL_ADMIN: {
    reports: ["read", "export"],
    student_referrals: ["create", "read"],
    visits: ["read"],
    emergency: ["read"],
    mar: ["read"],
  },
  DEPUTY_ADMIN: {
    reports: ["read"],
    student_referrals: ["create", "read", "update"],
    visits: ["read"],
    emergency: ["read"],
    mar: ["read"],
    circulars: ["read"],
  },
  PSYCHOLOGIST: {
    students: ["read"],
    health_profiles: ["read"],
    psychology: ["create", "read", "update"],
    internal_referrals: ["create", "read", "update"],
    reports: ["read", "export"],
  },
  SOCIAL_WORKER: {
    students: ["read"],
    health_profiles: ["read"],
    social: ["create", "read", "update"],
    internal_referrals: ["create", "read", "update"],
    reports: ["read", "export"],
  },
  TEACHER: {
    students: ["read"],
    student_referrals: ["create", "read"],
  },
  VIEWER: {
    students: ["read"],
    employees: ["read"],
    visits: ["read"],
    student_referrals: ["read"],
    reports: ["read"],
    circulars: ["read"],
  },
};

export function can(role: UserRole, resource: Resource, action: Action): boolean {
  const allowed = matrix[role]?.[resource] ?? [];
  return allowed.includes(action);
}

export function requirePermission(role: UserRole, resource: Resource, action: Action) {
  if (!can(role, resource, action)) {
    throw new Error("FORBIDDEN");
  }
}

export const CENTRAL_ROLES: UserRole[] = ["SUPER_ADMIN", "MEDICAL_MANAGER", "EXECUTIVE"];

export function isExecutiveRole(role: UserRole): boolean {
  return role === "EXECUTIVE";
}

export function canAccessPsychSocial(role: UserRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "MEDICAL_MANAGER" ||
    role === "PSYCHOLOGIST" ||
    role === "SOCIAL_WORKER"
  );
}
