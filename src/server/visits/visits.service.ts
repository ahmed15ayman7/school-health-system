import { prisma } from "@/lib/db";
import { assertClinicAccess } from "@/lib/clinic-scope";
import { nextSequence } from "@/lib/numbering";
import { writeAudit } from "@/lib/audit";
import type { ActorContext } from "@/server/context";
import type { Prisma } from "@prisma/client";
import { closeVisitSchema, createVisitSchema } from "@/lib/validations/visit";
import { vitalSignsSchema, type VitalSignsInput } from "@/lib/validations/vitals";
import { formatVisitReasons } from "@/lib/visit-reasons";

function buildReasonsJson(body: {
  reasons?: Record<string, unknown>;
  reasonList?: string[];
  otherReason?: string;
}) {
  if (body.reasons) return body.reasons;
  const list = body.reasonList ?? [];
  return { selected: list, other: body.otherReason ?? null };
}

function cleanVitals(raw?: VitalSignsInput): VitalSignsInput | undefined {
  if (!raw) return undefined;
  const out: VitalSignsInput = {};
  for (const [key, val] of Object.entries(raw) as [keyof VitalSignsInput, number | null | undefined][]) {
    if (typeof val === "number" && !Number.isNaN(val)) out[key] = val;
  }
  return Object.keys(out).length ? out : undefined;
}

export async function listVisits(
  actor: ActorContext,
  opts: { skip: number; take: number; clinicScope?: Record<string, unknown> },
) {
  const rows = await prisma.visit.findMany({
    where: { ...(opts.clinicScope ?? {}), isDeleted: false },
    include: { vitalSigns: true },
    orderBy: { dateTime: "desc" },
    take: opts.take,
    skip: opts.skip,
  });

  const studentIds = rows.filter((v) => v.visitorType === "STUDENT").map((v) => v.visitorId);
  const employeeIds = rows.filter((v) => v.visitorType === "EMPLOYEE").map((v) => v.visitorId);
  const [students, employees] = await Promise.all([
    studentIds.length
      ? prisma.student.findMany({
          where: { id: { in: studentIds } },
          select: { id: true, name: true, academicNumber: true, photoUrl: true },
        })
      : [],
    employeeIds.length
      ? prisma.employee.findMany({
          where: { id: { in: employeeIds } },
          select: { id: true, name: true, employeeNumber: true },
        })
      : [],
  ]);
  const studentMap = new Map(students.map((s) => [s.id, s]));
  const employeeMap = new Map(employees.map((e) => [e.id, e]));

  return rows.map((v) => {
    const student = v.visitorType === "STUDENT" ? studentMap.get(v.visitorId) : undefined;
    const employee = v.visitorType === "EMPLOYEE" ? employeeMap.get(v.visitorId) : undefined;
    return {
      ...v,
      visitorName: student?.name ?? employee?.name ?? "—",
      academicNumber: student?.academicNumber,
      photoUrl: student?.photoUrl,
      reasonsSummary: formatVisitReasons(v.reasonsJson),
    };
  });
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
  const pre = typeof raw === "object" && raw !== null ? { ...(raw as Record<string, unknown>) } : raw;
  if (pre && typeof pre === "object" && "vitals" in pre) {
    pre.vitals = cleanVitals(pre.vitals as VitalSignsInput);
  }
  const parsed = createVisitSchema.safeParse(pre);
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
