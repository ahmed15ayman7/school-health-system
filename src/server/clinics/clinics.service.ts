import { prisma } from "@/lib/db";
import { assertClinicAccess } from "@/lib/clinic-scope";
import type { ActorContext } from "@/server/context";
import { referralIsLate } from "@/server/referrals/referral-utils";

export async function getClinicDashboard(actor: ActorContext, clinicId: string) {
  assertClinicAccess(actor.role, actor.clinicId, clinicId);
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, include: { school: true } });
  if (!clinic) throw new Error("NOT_FOUND");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [visitsOpen, visitsClosed, emergencies, pendingRefs, recentVisits, pendingList] =
    await Promise.all([
      prisma.visit.count({
        where: { clinicId, status: "OPEN", isDeleted: false },
      }),
      prisma.visit.count({
        where: { clinicId, dateTime: { gte: todayStart }, status: "CLOSED", isDeleted: false },
      }),
      prisma.emergencyCase.count({ where: { eventTime: { gte: todayStart } } }),
      prisma.studentReferral.count({ where: { clinicId, status: "PENDING" } }),
      prisma.visit.findMany({
        where: { clinicId, isDeleted: false },
        orderBy: { dateTime: "desc" },
        take: 8,
        select: { id: true, visitNumber: true, dateTime: true, status: true, triageLevel: true },
      }),
      prisma.studentReferral.findMany({
        where: { clinicId, status: "PENDING" },
        include: { student: { select: { name: true, academicNumber: true } } },
        take: 10,
      }),
    ]);

  const referralsLate = pendingList.filter((r) => referralIsLate(r)).length;

  const lowStock = await prisma.medicationBatch.count({
    where: { quantity: { lte: 5 }, medication: { clinicId } },
  });

  return {
    clinic: { id: clinic.id, name: clinic.name, school: clinic.school.name },
    today: {
      visitsOpen,
      visitsClosed,
      emergencies,
      referralsPending: pendingRefs,
      referralsLate,
    },
    recentVisits,
    pendingReferrals: pendingList,
    alerts: { lowStock },
  };
}
