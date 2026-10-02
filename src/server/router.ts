import type { NextRequest } from "next/server";
import type { ActorContext } from "@/server/context";
import { ok, fail, parsePagination, paginationMeta } from "@/lib/api";
import { prisma } from "@/lib/db";
import { clinicFilter, assertClinicAccess } from "@/lib/clinic-scope";
import { writeAudit } from "@/lib/audit";
import { nextSequence } from "@/lib/numbering";
import { checkIdempotency, hashResponse } from "@/lib/idempotency";
import { notificationChannel, notifyGuardianOnReferralComplete } from "@/server/notifications/channels";
import { administerMedication } from "@/server/pharmacy/mar.service";
import { detectFrequentVisitors } from "@/server/alerts/frequent.service";
import { parseStudentImport } from "@/server/import/excel.service";
import { generateQrDataUrl } from "@/server/qr/qr.service";
import type { Resource } from "@/lib/rbac";
import type { Prisma, VisitorType } from "@prisma/client";

export async function handleApi(
  req: NextRequest,
  actor: ActorContext,
  resource: Resource,
  method: string,
  params?: { id?: string },
) {
  const pathname = req.nextUrl.pathname;
  const scope = clinicFilter(actor.role, actor.clinicId);
  const { page, pageSize, skip } = parsePagination(req.nextUrl.searchParams);

  if (pathname.includes("/alerts/frequent") && method === "GET") {
    return ok(await detectFrequentVisitors());
  }

  if (pathname.endsWith("/health") && method === "GET") {
    return ok({ status: "ok", time: new Date().toISOString() });
  }

  if (resource === "students" && method === "GET" && req.nextUrl.pathname.endsWith("/search")) {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const data = await prisma.student.findMany({
      where: {
        ...scope,
        isDeleted: false,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { academicNumber: { contains: q } },
          { qrCode: { contains: q } },
        ],
      },
      take: 20,
    });
    return ok(data);
  }

  if (resource === "students" && method === "POST" && req.nextUrl.pathname.endsWith("/import")) {
    const body = await req.json();
    const result = await parseStudentImport(body.rows ?? [], actor.userId);
    return ok(result);
  }

  if (resource === "students" && method === "GET") {
    const [total, data] = await Promise.all([
      prisma.student.count({ where: { ...scope, isDeleted: false } }),
      prisma.student.findMany({ where: { ...scope, isDeleted: false }, skip, take: pageSize, orderBy: { name: "asc" } }),
    ]);
    return ok(data, paginationMeta(total, page, pageSize));
  }

  if (resource === "students" && method === "POST") {
    const body = await req.json();
    assertClinicAccess(actor.role, actor.clinicId, body.clinicId);
    const created = await prisma.student.create({ data: { ...body, qrCode: body.qrCode ?? `STU-${body.academicNumber}` } });
    await writeAudit({ userId: actor.userId, actionType: "CREATE", tableName: "students", recordId: created.id, newValue: created });
    return ok(created, undefined, 201);
  }

  if (resource === "employees" && method === "GET") {
    const [total, data] = await Promise.all([
      prisma.employee.count({ where: { ...scope, isDeleted: false } }),
      prisma.employee.findMany({ where: { ...scope, isDeleted: false }, skip, take: pageSize }),
    ]);
    return ok(data, paginationMeta(total, page, pageSize));
  }

  if (resource === "employees" && method === "POST") {
    const body = await req.json();
    const created = await prisma.employee.create({ data: body });
    return ok(created, undefined, 201);
  }

  if (resource === "recommendations" && method === "GET") {
    const data = await prisma.medicalRecommendation.findMany({
      include: { employee: true, decisions: true },
      orderBy: { recommendedAt: "desc" },
      take: 50,
    });
    return ok(data);
  }

  if (resource === "recommendations" && method === "POST") {
    const id = params?.id;
    if (!id) return fail("BAD_REQUEST", "معرّف مطلوب");
    const body = await req.json();
    const decision = await prisma.recommendationDecision.create({
      data: {
        recommendationId: id,
        decision: body.decision,
        decidedById: actor.userId,
        notes: body.notes,
      },
    });
    await prisma.medicalRecommendation.update({ where: { id }, data: { status: body.decision } });
    return ok(decision);
  }

  if (resource === "visits" && method === "GET" && req.nextUrl.pathname.includes("/stats")) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const total = await prisma.visit.count({ where: { ...scope, dateTime: { gte: today } } });
    return ok({ total });
  }

  if (resource === "visits" && method === "GET") {
    const data = await prisma.visit.findMany({
      where: { ...scope, isDeleted: false },
      include: { vitalSigns: true },
      orderBy: { dateTime: "desc" },
      take: pageSize,
      skip,
    });
    return ok(data);
  }

  if (resource === "visits" && method === "POST" && !pathname.endsWith("/close")) {
    const body = await req.json();
    assertClinicAccess(actor.role, actor.clinicId, body.clinicId);
    const created = await prisma.$transaction(async (tx) => {
      const visitNumber = await nextSequence(tx, "VIS");
      return tx.visit.create({
        data: {
          visitNumber,
          dateTime: new Date(),
          clinicId: body.clinicId,
          nurseId: actor.userId,
          visitorType: body.visitorType,
          visitorId: body.visitorId,
          reasonsJson: body.reasons ?? {},
          triageLevel: body.triageLevel ?? "LOW",
          entryTime: new Date(),
          status: "OPEN",
        },
      });
    });
    return ok(created, undefined, 201);
  }

  if (resource === "visits" && method === "POST" && pathname.endsWith("/close")) {
    const id = params?.id!;
    const visit = await prisma.visit.findUnique({ where: { id } });
    if (!visit) return fail("NOT_FOUND", "الزيارة غير موجودة", 404);
    const openHours = (Date.now() - visit.entryTime.getTime()) / 36e5;
    if (openHours > 24 && actor.role !== "HEAD_NURSE" && actor.role !== "SUPER_ADMIN") {
      return fail("FORBIDDEN", "إغلاق الزيارة المفتوحة >24 ساعة لرئيس التمريض فقط", 403);
    }
    const body = await req.json();
    const updated = await prisma.visit.update({
      where: { id },
      data: { status: "CLOSED", exitTime: new Date(), outcome: body.outcome, recommendations: body.recommendations },
    });
    return ok(updated);
  }

  if (resource === "student_referrals" && method === "GET" && req.nextUrl.pathname.includes("/stats")) {
    const pending = await prisma.studentReferral.count({ where: { ...scope, status: "PENDING" } });
    return ok({ pending });
  }

  if (resource === "student_referrals" && method === "GET") {
    const data = await prisma.studentReferral.findMany({
      where: scope,
      include: { student: true },
      orderBy: { referralTime: "desc" },
      take: pageSize,
    });
    return ok(data);
  }

  if (
    resource === "student_referrals" &&
    method === "POST" &&
    !pathname.includes("/receive") &&
    !pathname.includes("/start-treatment") &&
    !pathname.includes("/complete")
  ) {
    const body = await req.json();
    const student = await prisma.student.findUnique({ where: { id: body.studentId } });
    if (!student) return fail("NOT_FOUND", "الطالب غير موجود", 404);
    assertClinicAccess(actor.role, actor.clinicId, student.clinicId);
    const created = await prisma.$transaction(async (tx) => {
      const referralNumber = await nextSequence(tx, "REF");
      return tx.studentReferral.create({
        data: {
          referralNumber,
          studentId: student.id,
          referredById: actor.userId,
          referredByName: actor.fullName,
          referredByRole: actor.role,
          reasonCategory: body.reasonCategory,
          reasonDetails: body.reasonDetails,
          severity: body.severity ?? "NORMAL",
          clinicId: student.clinicId,
        },
      });
    });
    return ok(created, undefined, 201);
  }

  if (resource === "student_referrals" && method === "POST" && pathname.includes("/receive")) {
    const id = params?.id!;
    const key = req.headers.get("idempotency-key");
    const idem = await checkIdempotency(key, req.nextUrl.pathname);
    if (idem.replay) return ok({ replay: true });
    const updated = await prisma.studentReferral.update({
      where: { id },
      data: { status: "RECEIVED", receivedTime: new Date() },
    });
    return ok(updated);
  }

  if (resource === "student_referrals" && method === "POST" && pathname.includes("/start-treatment")) {
    const id = params?.id!;
    const updated = await prisma.studentReferral.update({
      where: { id },
      data: { status: "IN_TREATMENT", treatmentStartTime: new Date() },
    });
    return ok(updated);
  }

  if (resource === "student_referrals" && method === "POST" && pathname.includes("/complete")) {
    const id = params?.id!;
    const body = await req.json();
    const ref = await prisma.studentReferral.update({
      where: { id },
      data: {
        status: "COMPLETED",
        treatmentEndTime: new Date(),
        departureTime: new Date(),
        diagnosis: body.diagnosis,
        procedure: body.procedure,
        recommendations: body.recommendations,
        outcome: body.outcome,
        guardianNotified: true,
        guardianNotifiedAt: new Date(),
      },
      include: { student: true },
    });
    await notifyGuardianOnReferralComplete({
      studentName: ref.student.name,
      guardianPhone: ref.student.guardianPhone,
      summary: body.recommendations ?? "اكتمال الزيارة",
    });
    return ok(ref);
  }

  if (resource === "emergency" && method === "POST") {
    const key = req.headers.get("idempotency-key");
    if (!key) return fail("IDEMPOTENCY_REQUIRED", "Idempotency-Key مطلوب", 400);
    const idem = await checkIdempotency(key, "emergency");
    if (idem.replay) return ok({ replay: true });
    const body = await req.json();
    const created = await prisma.$transaction(async (tx) => {
      const caseNumber = await nextSequence(tx, "EMG");
      return tx.emergencyCase.create({
        data: {
          caseNumber,
          eventTime: new Date(),
          location: body.location,
          visitorType: body.visitorType,
          visitorId: body.visitorId,
          vitalSignsJson: body.vitalSigns,
          interventionsJson: body.interventions,
          medicationsUsedJson: body.medicationsUsed,
          responseLevel: body.responseLevel,
          referralDecision: body.referralDecision,
        },
      });
    });
    const managers = await prisma.user.findMany({
      where: { role: { in: ["MEDICAL_MANAGER", "HEAD_NURSE"] }, isActive: true },
      select: { id: true },
    });
    for (const m of managers) {
      await notificationChannel.sendInApp({
        userId: m.id,
        type: "EMERGENCY",
        title: "حالة طارئة",
        message: `تم تسجيل ${created.caseNumber} في ${created.location}`,
        link: "/emergency",
      });
    }
    const payload = { id: created.id, caseNumber: created.caseNumber };
    await prisma.idempotencyKey.update({
      where: { key },
      data: { responseHash: hashResponse(payload) },
    });
    return ok(payload, undefined, 201);
  }

  if (resource === "emergency" && method === "GET") {
    const data = await prisma.emergencyCase.findMany({ orderBy: { eventTime: "desc" }, take: pageSize });
    return ok(data);
  }

  if (resource === "mar" && method === "POST") {
    const body = await req.json();
    const result = await administerMedication({
      actor,
      visitorType: body.visitorType as VisitorType,
      visitorId: body.visitorId,
      medicationId: body.medicationId,
      batchId: body.batchId,
      dose: body.dose,
      unit: body.unit,
      reason: body.reason,
      allergyOverride: body.allergyOverride,
    });
    return ok(result, undefined, 201);
  }

  if (resource === "medications" && method === "GET" && req.nextUrl.pathname.includes("/alerts")) {
    const soon = new Date();
    soon.setDate(soon.getDate() + 30);
    const batches = await prisma.medicationBatch.findMany({
      where: {
        OR: [{ quantity: { lte: 5 } }, { expiryDate: { lte: soon } }],
        medication: scope.clinicId ? { clinicId: scope.clinicId } : undefined,
      },
      include: { medication: true },
      take: 50,
    });
    return ok(batches);
  }

  if (resource === "medications" && method === "GET") {
    const data = await prisma.medication.findMany({
      where: { ...scope, isDeleted: false },
      include: { batches: true },
    });
    return ok(data);
  }

  if (resource === "medications" && method === "POST") {
    const body = await req.json();
    const med = await prisma.medication.create({ data: body });
    return ok(med, undefined, 201);
  }

  if (resource === "inventory" && method === "GET") {
    const batches = await prisma.medicationBatch.findMany({
      include: { medication: true },
      where: scope.clinicId ? { medication: { clinicId: scope.clinicId } } : undefined,
    });
    return ok(batches);
  }

  if (resource === "inventory" && method === "POST" && req.nextUrl.pathname.includes("/adjustments")) {
    const body = await req.json();
    if (actor.role !== "HEAD_NURSE" && actor.role !== "SUPER_ADMIN" && actor.role !== "PHARMACY") {
      return fail("FORBIDDEN", "تسوية الجرد تحتاج صلاحية", 403);
    }
    const tx = await prisma.inventoryTransaction.create({
      data: {
        medicationId: body.medicationId,
        transactionType: "ADJUSTMENT",
        quantity: body.quantity,
        performedById: actor.userId,
        notes: body.notes,
        approvedById: actor.userId,
      },
    });
    return ok(tx);
  }

  if (resource === "inventory" && method === "POST") {
    const body = await req.json();
    const result = await prisma.$transaction(async (tx) => {
      const record = await tx.inventoryTransaction.create({
        data: { ...body, performedById: actor.userId },
      });
      if (body.transactionType === "IN") {
        await tx.medicationBatch.create({
          data: {
            medicationId: body.medicationId,
            batchNumber: body.batchNumber ?? "BATCH",
            quantity: body.quantity,
            expiryDate: new Date(body.expiryDate),
          },
        });
      }
      return record;
    });
    return ok(result, undefined, 201);
  }

  if (resource === "canteen" && method === "GET") {
    const data = await prisma.canteenInspection.findMany({
      include: { items: true },
      orderBy: { inspectionDate: "desc" },
      take: pageSize,
    });
    return ok(data);
  }

  if (resource === "canteen" && method === "POST" && req.nextUrl.pathname.includes("/incidents")) {
    const body = await req.json();
    const incident = await prisma.foodIncident.create({ data: body });
    return ok(incident, undefined, 201);
  }

  if (resource === "canteen" && method === "POST") {
    const body = await req.json();
    const inspection = await prisma.canteenInspection.create({
      data: {
        canteenId: body.canteenId,
        inspectionDate: new Date(body.inspectionDate),
        inspectorId: actor.userId,
        overallResult: body.overallResult,
        notes: body.notes,
        items: { create: body.items ?? [] },
      },
      include: { items: true },
    });
    return ok(inspection, undefined, 201);
  }

  if (resource === "psychology" && method === "GET") {
    const data = await prisma.psychologySession.findMany({ include: { student: true }, take: pageSize });
    return ok(data);
  }

  if (resource === "psychology" && method === "POST") {
    const body = await req.json();
    const created = await prisma.$transaction(async (tx) => {
      const sessionNumber = await nextSequence(tx, "PSY");
      return tx.psychologySession.create({
        data: { ...body, sessionNumber, counselorId: actor.userId, sessionDate: new Date(body.sessionDate) },
      });
    });
    return ok(created, undefined, 201);
  }

  if (resource === "social" && method === "GET") {
    const data = await prisma.socialCase.findMany({ include: { student: true }, take: pageSize });
    return ok(data);
  }

  if (resource === "social" && method === "POST") {
    const body = await req.json();
    const created = await prisma.$transaction(async (tx) => {
      const caseNumber = await nextSequence(tx, "SOC");
      return tx.socialCase.create({
        data: { ...body, caseNumber, socialWorkerId: actor.userId },
      });
    });
    return ok(created, undefined, 201);
  }

  if (resource === "internal_referrals" && method === "GET") {
    const data = await prisma.internalReferral.findMany({ orderBy: { createdAt: "desc" }, take: pageSize });
    return ok(data);
  }

  if (resource === "internal_referrals" && method === "POST") {
    const body = await req.json();
    const created = await prisma.internalReferral.create({
      data: { ...body, fromUserId: actor.userId },
    });
    return ok(created, undefined, 201);
  }

  if (resource === "students" && method === "GET" && req.nextUrl.pathname.includes("/frequent")) {
    const data = await detectFrequentVisitors();
    return ok(data);
  }

  if (resource === "circulars" && method === "GET" && req.nextUrl.pathname.includes("/notifications")) {
    const data = await prisma.notification.findMany({
      where: { userId: actor.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    return ok(data);
  }

  if (resource === "circulars" && method === "GET") {
    const data = await prisma.circular.findMany({ orderBy: { issuedAt: "desc" }, take: pageSize });
    return ok(data);
  }

  if (resource === "circulars" && method === "POST") {
    const body = await req.json();
    const created = await prisma.circular.create({
      data: { ...body, issuedById: actor.userId },
    });
    return ok(created, undefined, 201);
  }

  if (resource === "reports" && method === "GET") {
    const visits = await prisma.visit.count();
    return ok({ visits });
  }

  if (resource === "reports" && method === "POST") {
    await writeAudit({
      userId: actor.userId,
      actionType: "EXPORT",
      tableName: "reports",
      newValue: { format: (await req.json()).format },
    });
    return ok({ message: "تم تسجيل طلب التصدير — استخدم /print للطباعة" });
  }

  if (resource === "settings" && method === "GET" && req.nextUrl.pathname.includes("/clinics")) {
    const data = await prisma.clinic.findMany({ include: { school: true } });
    return ok(data);
  }

  if (resource === "settings" && method === "GET") {
    const data = await prisma.user.findMany({ select: { id: true, username: true, fullName: true, role: true, clinicId: true } });
    return ok(data);
  }

  if (resource === "audit_logs" && method === "GET") {
    const data = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: pageSize });
    return ok(data);
  }

  if (method === "GET" && req.nextUrl.pathname.endsWith("/health")) {
    return ok({ status: "ok", time: new Date().toISOString() });
  }

  if (method === "GET" && req.nextUrl.searchParams.get("q") !== null) {
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const [students, employees] = await Promise.all([
      prisma.student.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 10 }),
      prisma.employee.findMany({ where: { name: { contains: q, mode: "insensitive" } }, take: 10 }),
    ]);
    return ok({ students, employees });
  }

  return fail("NOT_IMPLEMENTED", `No handler for ${resource} ${method}`, 501);
}
