import { prisma } from "@/lib/db";
import { assertClinicAccess } from "@/lib/clinic-scope";
import type { ActorContext } from "@/server/context";
import { getMedicalProfile, profileToAlerts } from "@/server/health/health.service";

export async function getStudentForProfile(actor: ActorContext, id: string) {
  const student = await prisma.student.findUnique({ where: { id, isDeleted: false } });
  if (!student) return null;
  assertClinicAccess(actor.role, actor.clinicId, student.clinicId);
  const profile = await getMedicalProfile("STUDENT", id);
  const alerts = profileToAlerts(profile);
  return { student, profile, alerts };
}
