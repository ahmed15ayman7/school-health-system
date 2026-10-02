import { prisma } from "@/lib/db";
import type { OwnerType } from "@prisma/client";
import type { MedicalAlert } from "@/components/shared/MedicalAlertBanner";

export async function getMedicalProfile(ownerType: OwnerType, ownerId: string) {
  return prisma.medicalProfile.findUnique({
    where: { ownerType_ownerId: { ownerType, ownerId } },
    include: {
      allergies: true,
      chronicConditions: true,
      continuousMedications: true,
      vaccinations: true,
      growthMeasurements: { orderBy: { measuredAt: "desc" }, take: 10 },
      visionScreenings: { orderBy: { screenedAt: "desc" }, take: 5 },
      injuries: { orderBy: { injuryDate: "desc" }, take: 10 },
    },
  });
}

export function profileToAlerts(profile: Awaited<ReturnType<typeof getMedicalProfile>>): MedicalAlert[] {
  if (!profile) return [];
  const alerts: MedicalAlert[] = [];
  for (const a of profile.allergies) {
    alerts.push({ type: "allergy", severity: a.severity, label: `حساسية: ${a.type}` });
  }
  for (const c of profile.chronicConditions) {
    alerts.push({ type: "chronic", label: `مرض مزمن: ${c.diagnosis}` });
  }
  for (const m of profile.continuousMedications) {
    alerts.push({ type: "medication", label: `دواء مستمر: ${m.medicationName}` });
  }
  return alerts;
}
