import { prisma } from "@/lib/db";
import { assertClinicAccess } from "@/lib/clinic-scope";
import { nextSequence } from "@/lib/numbering";
import type { ActorContext } from "@/server/context";
import { referralIsLate } from "@/server/referrals/referral-utils";
import { completeReferralSchema, createStudentReferralSchema } from "@/lib/validations/student-referral";
import { notifyGuardianOnReferralComplete } from "@/server/notifications/channels";
import { checkIdempotency } from "@/lib/idempotency";

export async function getReferralById(actor: ActorContext, id: string) {
  const ref = await prisma.studentReferral.findUnique({
    where: { id },
    include: { student: true },
  });
  if (!ref) return null;
  assertClinicAccess(actor.role, actor.clinicId, ref.clinicId);
  return { ...ref, isLate: referralIsLate(ref) };
}

export async function getReferralStats(actor: ActorContext) {
  const { clinicFilter } = await import("@/lib/clinic-scope");
  const scope = clinicFilter(actor.role, actor.clinicId);
  const refs = await prisma.studentReferral.findMany({
    where: { ...scope, status: "COMPLETED", waitingMinutes: { not: null } },
    select: { waitingMinutes: true, treatmentMinutes: true },
    take: 500,
  });
  const pending = await prisma.studentReferral.count({ where: { ...scope, status: "PENDING" } });
  const pendingRefs = await prisma.studentReferral.findMany({
    where: { ...scope, status: "PENDING" },
    select: { referralTime: true },
  });
  const late = pendingRefs.filter((r) => referralIsLate(r as never)).length;
  const avgWait =
    refs.length > 0
      ? refs.reduce((s, r) => s + (r.waitingMinutes ?? 0), 0) / refs.length
      : 0;
  const avgTreat =
    refs.length > 0
      ? refs.reduce((s, r) => s + (r.treatmentMinutes ?? 0), 0) / refs.length
      : 0;
  return { pending, late, avgWaitingMinutes: Math.round(avgWait), avgTreatmentMinutes: Math.round(avgTreat) };
}

export async function createReferral(actor: ActorContext, raw: unknown) {
  const parsed = createStudentReferralSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const student = await prisma.student.findUnique({ where: { id: parsed.data.studentId } });
  if (!student) throw new Error("NOT_FOUND");
  assertClinicAccess(actor.role, actor.clinicId, student.clinicId);
  return prisma.$transaction(async (tx) => {
    const referralNumber = await nextSequence(tx, "REF");
    return tx.studentReferral.create({
      data: {
        referralNumber,
        studentId: student.id,
        referredById: actor.userId,
        referredByName: actor.fullName,
        referredByRole: actor.role,
        reasonCategory: parsed.data.reasonCategory,
        reasonDetails: parsed.data.reasonDetails,
        severity: parsed.data.severity,
        clinicId: student.clinicId,
      },
      include: { student: true },
    });
  });
}

export async function receiveReferral(actor: ActorContext, id: string, idempotencyKey: string | null) {
  const idem = await checkIdempotency(idempotencyKey, `referrals/${id}/receive`);
  if (idem.replay) return { replay: true as const };
  const ref = await prisma.studentReferral.findUnique({ where: { id } });
  if (!ref) throw new Error("NOT_FOUND");
  assertClinicAccess(actor.role, actor.clinicId, ref.clinicId);
  const receivedTime = new Date();
  const waitingMinutes = Math.round((receivedTime.getTime() - ref.referralTime.getTime()) / 60000);
  return prisma.studentReferral.update({
    where: { id },
    data: { status: "RECEIVED", receivedTime, waitingMinutes },
    include: { student: true },
  });
}

export async function startReferralTreatment(actor: ActorContext, id: string) {
  const ref = await prisma.studentReferral.findUnique({ where: { id } });
  if (!ref) throw new Error("NOT_FOUND");
  assertClinicAccess(actor.role, actor.clinicId, ref.clinicId);
  return prisma.studentReferral.update({
    where: { id },
    data: { status: "IN_TREATMENT", treatmentStartTime: new Date() },
    include: { student: true },
  });
}

export async function completeReferral(actor: ActorContext, id: string, raw: unknown) {
  const parsed = completeReferralSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const ref0 = await prisma.studentReferral.findUnique({ where: { id }, include: { student: true } });
  if (!ref0) throw new Error("NOT_FOUND");
  assertClinicAccess(actor.role, actor.clinicId, ref0.clinicId);
  const treatmentEndTime = new Date();
  const departureTime = new Date();
  let treatmentMinutes: number | undefined;
  if (ref0.treatmentStartTime) {
    treatmentMinutes = Math.round(
      (treatmentEndTime.getTime() - ref0.treatmentStartTime.getTime()) / 60000,
    );
  }
  const totalMinutes = Math.round((departureTime.getTime() - ref0.referralTime.getTime()) / 60000);
  const ref = await prisma.studentReferral.update({
    where: { id },
    data: {
      status: "COMPLETED",
      treatmentEndTime,
      departureTime,
      treatmentMinutes,
      totalMinutes,
      diagnosis: parsed.data.diagnosis,
      procedure: parsed.data.procedure,
      recommendations: parsed.data.recommendations,
      outcome: parsed.data.outcome,
      guardianNotified: true,
      guardianNotifiedAt: new Date(),
    },
    include: { student: true },
  });
  await notifyGuardianOnReferralComplete({
    studentName: ref.student.name,
    guardianPhone: ref.student.guardianPhone,
    summary: parsed.data.recommendations ?? "اكتمال الزيارة",
  });
  return ref;
}
