import { prisma } from "@/lib/db";
import { assertClinicAccess } from "@/lib/clinic-scope";
import { nextSequence } from "@/lib/numbering";
import { writeAudit } from "@/lib/audit";
import type { ActorContext } from "@/server/context";
import type { Prisma } from "@prisma/client";
import { closeVisitSchema, createVisitSchema } from "@/lib/validations/visit";

function buildReasonsJson(body: {
  reasons?: Record<string, unknown>;
  reasonList?: string[];
  otherReason?: string;
}) {
  if (body.reasons) return body.reasons;
  const list = body.reasonList ?? [];
  return { selected: list, other: body.otherReason ?? null };
}

export async function getVisitById(actor: ActorContext, id: string) {
  const visit = await prisma.visit.findFirst({
    where: { id, isDeleted: false },
    include: {
      vitalSigns: true,
      diagnoses: true,
      treatments: true,
      referrals: true,
      nurse: { select: { id: true, fullName: true } },
    },
  });
  if (!visit) return null;
  assertClinicAccess(actor.role, actor.clinicId, visit.clinicId);
  let visitorName = "";
  if (visit.visitorType === "STUDENT") {
    const s = await prisma.student.findUnique({ where: { id: visit.visitorId } });
    visitorName = s?.name ?? "";
  } else {
    const e = await prisma.employee.findUnique({ where: { id: visit.visitorId } });
    visitorName = e?.name ?? "";
  }
  return { ...visit, visitorName };
}

export async function createVisit(actor: ActorContext, raw: unknown) {
  const parsed = createVisitSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const body = parsed.data;
  assertClinicAccess(actor.role, actor.clinicId, body.clinicId);

  const created = await prisma.$transaction(async (tx) => {
    const visitNumber = await nextSequence(tx, "VIS");
    const visit = await tx.visit.create({
      data: {
        visitNumber,
        dateTime: new Date(),
        clinicId: body.clinicId,
        nurseId: actor.userId,
        visitorType: body.visitorType,
        visitorId: body.visitorId,
        reasonsJson: buildReasonsJson(body) as Prisma.InputJsonValue,
        triageLevel: body.triageLevel,
        triageReason: body.triageReason,
        triageAction: body.triageAction,
        entryTime: new Date(),
        status: "OPEN",
      },
    });
    if (body.vitals) {
      await tx.vitalSign.create({
        data: { visitId: visit.id, ...body.vitals },
      });
    }
    return visit;
  });

  await writeAudit({
    userId: actor.userId,
    actionType: "CREATE",
    tableName: "visits",
    recordId: created.id,
    newValue: created,
  });
  return getVisitById(actor, created.id);
}

export async function upsertVisitVitals(actor: ActorContext, visitId: string, raw: unknown) {
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit || visit.isDeleted) throw new Error("NOT_FOUND");
  assertClinicAccess(actor.role, actor.clinicId, visit.clinicId);
  const { vitalSignsSchema } = require("@/lib/validations/vitals") as typeof import("@/lib/validations/vitals");
  const parsed = vitalSignsSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  return prisma.vitalSign.upsert({
    where: { visitId },
    create: { visitId, ...parsed.data },
    update: parsed.data,
  });
}

export async function closeVisit(actor: ActorContext, visitId: string, raw: unknown) {
  const parsed = closeVisitSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const visit = await prisma.visit.findUnique({ where: { id: visitId } });
  if (!visit) throw new Error("NOT_FOUND");
  assertClinicAccess(actor.role, actor.clinicId, visit.clinicId);
  const openHours = (Date.now() - visit.entryTime.getTime()) / 36e5;
  if (openHours > 24 && actor.role !== "HEAD_NURSE" && actor.role !== "SUPER_ADMIN") {
    throw new Error("FORBIDDEN");
  }
  const exitTime = new Date();
  const durationMinutes = Math.round((exitTime.getTime() - visit.entryTime.getTime()) / 60000);
  const updated = await prisma.visit.update({
    where: { id: visitId },
    data: {
      status: "CLOSED",
      exitTime,
      durationMinutes,
      outcome: parsed.data.outcome,
      procedure: parsed.data.procedure,
      recommendations: parsed.data.recommendations,
      notes: parsed.data.notes,
    },
  });
  await writeAudit({
    userId: actor.userId,
    actionType: "UPDATE",
    tableName: "visits",
    recordId: visitId,
    newValue: updated,
  });
  return updated;
}
