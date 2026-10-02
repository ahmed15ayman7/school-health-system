import { prisma } from "@/lib/db";
import { assertClinicAccess } from "@/lib/clinic-scope";
import type { ActorContext } from "@/server/context";
import { getMedicalProfile } from "@/server/health/health.service";

export type TimelineEvent = {
  at: string;
  type: string;
  title: string;
  detail?: string;
  link?: string;
};

export async function getStudentHistory(actor: ActorContext, studentId: string): Promise<TimelineEvent[]> {
  const student = await prisma.student.findUnique({ where: { id: studentId, isDeleted: false } });
  if (!student) throw new Error("NOT_FOUND");
  assertClinicAccess(actor.role, actor.clinicId, student.clinicId);

  const [visits, referrals, profile] = await Promise.all([
    prisma.visit.findMany({
      where: { visitorType: "STUDENT", visitorId: studentId, isDeleted: false },
      orderBy: { dateTime: "desc" },
      take: 50,
    }),
    prisma.studentReferral.findMany({
      where: { studentId },
      orderBy: { referralTime: "desc" },
      take: 30,
    }),
    getMedicalProfile("STUDENT", studentId),
  ]);

  const events: TimelineEvent[] = [];

  for (const v of visits) {
    events.push({
      at: v.dateTime.toISOString(),
      type: "visit",
      title: `زيارة ${v.visitNumber}`,
      detail: `${v.triageLevel} — ${v.status}`,
      link: `/visits/${v.id}`,
    });
  }
  for (const r of referrals) {
    events.push({
      at: r.referralTime.toISOString(),
      type: "referral",
      title: `تحويل ${r.referralNumber}`,
      detail: r.status,
      link: `/referrals/${r.id}`,
    });
  }
  if (profile) {
    for (const a of profile.allergies) {
      events.push({
        at: profile.updatedAt.toISOString(),
        type: "allergy",
        title: `حساسية: ${a.type}`,
        detail: a.severity ?? undefined,
      });
    }
    for (const inj of profile.injuries) {
      events.push({
        at: inj.injuryDate.toISOString(),
        type: "injury",
        title: inj.description,
        detail: inj.location ?? undefined,
      });
    }
  }

  events.sort((a, b) => (a.at < b.at ? 1 : -1));
  return events;
}
