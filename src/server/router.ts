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
import {
  getVisitById,
  createVisit,
  closeVisit,
  upsertVisitVitals,
  listVisits,
} from "@/server/visits/visits.service";
import {
  getReferralById,
  getReferralStats,
  createReferral,
  receiveReferral,
  startReferralTreatment,
  completeReferral,
} from "@/server/referrals/referrals.service";
import { getStudentHistory } from "@/server/health/history.service";
import { getClinicDashboard } from "@/server/clinics/clinics.service";
import { getMedicalProfile, profileToAlerts } from "@/server/health/health.service";
import { advancedSearch } from "@/server/search/search.service";
import {
  listSafetyInspections,
  listAedDevices,
  listFirstAidKits,
  listScienceLabs,
  listWaterTests,
  listLicenses,
  listLabChemicals,
  createSafetyInspection,
} from "@/server/safety/safety.service";
import { getReportsSummary } from "@/server/reports/reports.service";
import { exportMedicalExcel, exportSafetyExcel } from "@/server/reports/export.service";
import {
  listTodayDoses,
  createMedicationOrder,
  runDoseReminders,
} from "@/server/pharmacy/med-schedule.service";
import { runComplianceAlerts } from "@/server/jobs/compliance-alerts.service";
import { canAccessPsychSocial } from "@/lib/rbac";
import type { Resource } from "@/lib/rbac";
import type { Prisma, VisitorType } from "@prisma/client";
import { NextResponse } from "next/server";

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

  if (pathname.includes("/jobs/") && method === "POST") {
    const secret = req.headers.get("x-cron-secret");
    if (secret !== process.env.CRON_SECRET) return fail("FORBIDDEN", "Cron secret invalid", 403);
    if (pathname.includes("dose-reminders")) return ok(await runDoseReminders());
    if (pathname.includes("compliance-alerts")) return ok(await runComplianceAlerts());
    return fail("NOT_FOUND", "Unknown job", 404);
  }

  if (resource === "safety" && method === "GET" && pathname.includes("/inspections")) {
    return ok(await listSafetyInspections(actor));
  }
  if (resource === "safety" && method === "POST" && pathname.includes("/inspections")) {
    const body = await req.json();
    return ok(await createSafetyInspection(actor, body), undefined, 201);
  }
  if (resource === "safety" && method === "GET" && pathname.includes("/aed")) {
    return ok(await listAedDevices(actor));
  }
  if (resource === "safety" && method === "GET" && pathname.includes("/first-aid")) {
    return ok(await listFirstAidKits(actor));
  }
  if (resource === "safety" && method === "GET" && pathname.includes("/labs")) {
    return ok(await listScienceLabs(actor));
  }
  if (resource === "safety" && method === "GET" && pathname.includes("/chemicals")) {
    return ok(await listLabChemicals(actor));
  }
  if (resource === "safety" && method === "GET" && pathname.includes("/water-tests")) {
    return ok(await listWaterTests());
  }
  if (resource === "safety" && method === "GET" && pathname.includes("/licenses")) {
    return ok(await listLicenses());
  }

  if (resource === "medications" && method === "GET" && pathname.includes("/doses/today")) {
    return ok(await listTodayDoses(actor));
  }
  if (resource === "medications" && method === "POST" && pathname.includes("/orders")) {
    const body = await req.json();
    return ok(await createMedicationOrder(actor, body), undefined, 201);
  }

  if (pathname.includes("/alerts/frequent") && method === "GET") {
    return ok(await detectFrequentVisitors());
  }

  if (pathname.endsWith("/health") && method === "GET") {
    return ok({ status: "ok", time: new Date().toISOString() });
  }

  if (pathname.includes("/clinics/") && pathname.includes("/dashboard") && method === "GET" && params?.id) {
    try {
      return ok(await getClinicDashboard(actor, params.id));
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") return fail("NOT_FOUND", "العيادة غير موجودة", 404);
      throw e;
    }
  }

  if (resource === "students" && method === "GET" && pathname.endsWith("/history") && params?.id) {
    try {
      return ok(await getStudentHistory(actor, params.id));
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") return fail("NOT_FOUND", "الطالب غير موجود", 404);
      throw e;
    }
  }

  if (resource === "students" && method === "GET" && pathname.endsWith("/profile") && params?.id) {
    const student = await prisma.student.findUnique({ where: { id: params.id, isDeleted: false } });
    if (!student) return fail("NOT_FOUND", "الطالب غير موجود", 404);
    try {
      assertClinicAccess(actor.role, actor.clinicId, student.clinicId);
    } catch {
      return fail("CLINIC_FORBIDDEN", "لا يمكن الوصول", 403);
    }
    const profile = await getMedicalProfile("STUDENT", params.id);
    return ok({ student, profile, alerts: profileToAlerts(profile) });
  }

  if (resource === "students" && method === "GET" && params?.id && !pathname.endsWith("/search")) {
    const student = await prisma.student.findUnique({ where: { id: params.id, isDeleted: false } });
    if (!student) return fail("NOT_FOUND", "الطالب غير موجود", 404);
    try {
      assertClinicAccess(actor.role, actor.clinicId, student.clinicId);
    } catch {
      return fail("CLINIC_FORBIDDEN", "لا يمكن الوصول", 403);
    }
    return ok(student);
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

  if (resource === "visits" && method === "GET" && params?.id && !pathname.includes("/stats")) {
    const visit = await getVisitById(actor, params.id);
    if (!visit) return fail("NOT_FOUND", "الزيارة غير موجودة", 404);
    return ok(visit);
  }

  if (resource === "visits" && method === "POST" && pathname.endsWith("/vitals") && params?.id) {
    try {
      const body = await req.json();
      return ok(await upsertVisitVitals(actor, params.id, body));
    } catch (e) {
      if (e instanceof Error && e.message === "VALIDATION_ERROR") return fail("VALIDATION_ERROR", "علامات حيوية غير صالحة", 400);
      throw e;
    }
  }

  if (resource === "visits" && method === "GET" && req.nextUrl.pathname.includes("/stats")) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const total = await prisma.visit.count({ where: { ...scope, dateTime: { gte: today } } });
    return ok({ total });
  }

  if (resource === "visits" && method === "GET" && !params?.id && !pathname.includes("/stats")) {
    const total = await prisma.visit.count({ where: { ...scope, isDeleted: false } });
    const data = await listVisits(actor, { skip, take: pageSize, clinicScope: scope });
    return ok(data, paginationMeta(total, page, pageSize));
  }

  if (resource === "visits" && method === "POST" && !pathname.endsWith("/close") && !pathname.endsWith("/vitals")) {
    try {
      const body = await req.json();
      const created = await createVisit(actor, body);
      return ok(created, undefined, 201);
    } catch (e) {
      if (e instanceof Error && e.message === "VALIDATION_ERROR") return fail("VALIDATION_ERROR", "بيانات الزيارة غير صالحة", 400);
      if (e instanceof Error && e.message === "CLINIC_FORBIDDEN") return fail("CLINIC_FORBIDDEN", "لا يمكن الوصول لبيانات عيادة أخرى", 403);
      throw e;
    }
  }

  if (resource === "visits" && method === "POST" && pathname.endsWith("/close")) {
    const id = params?.id!;
    try {
      const body = await req.json();
      return ok(await closeVisit(actor, id, body));
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") return fail("NOT_FOUND", "الزيارة غير موجودة", 404);
      if (e instanceof Error && e.message === "FORBIDDEN") return fail("FORBIDDEN", "إغلاق الزيارة >24 ساعة لرئيس التمريض فقط", 403);
      if (e instanceof Error && e.message === "VALIDATION_ERROR") return fail("VALIDATION_ERROR", "بيانات الإغلاق غير صالحة", 400);
      throw e;
    }
  }

  if (resource === "student_referrals" && method === "GET" && req.nextUrl.pathname.includes("/stats")) {
    return ok(await getReferralStats(actor));
  }

  if (resource === "student_referrals" && method === "GET" && params?.id) {
    const ref = await getReferralById(actor, params.id);
    if (!ref) return fail("NOT_FOUND", "التحويل غير موجود", 404);
    return ok(ref);
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
    try {
      const body = await req.json();
      const created = await createReferral(actor, body);
      return ok(created, undefined, 201);
    } catch (e) {
      if (e instanceof Error && e.message === "VALIDATION_ERROR") return fail("VALIDATION_ERROR", "بيانات التحويل غير صالحة", 400);
      if (e instanceof Error && e.message === "NOT_FOUND") return fail("NOT_FOUND", "الطالب غير موجود", 404);
      throw e;
    }
  }

  if (resource === "student_referrals" && method === "POST" && pathname.includes("/receive")) {
    const id = params?.id!;
    try {
      const key = req.headers.get("idempotency-key");
      const result = await receiveReferral(actor, id, key);
      return ok(result);
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") return fail("NOT_FOUND", "التحويل غير موجود", 404);
      throw e;
    }
  }

  if (resource === "student_referrals" && method === "POST" && pathname.includes("/start-treatment")) {
    const id = params?.id!;
    try {
      return ok(await startReferralTreatment(actor, id));
    } catch (e) {
      if (e instanceof Error && e.message === "NOT_FOUND") return fail("NOT_FOUND", "التحويل غير موجود", 404);
      throw e;
    }
  }

  if (resource === "student_referrals" && method === "POST" && pathname.includes("/complete")) {
    const id = params?.id!;
    try {
      const body = await req.json();
      return ok(await completeReferral(actor, id, body));
    } catch (e) {
      if (e instanceof Error && e.message === "VALIDATION_ERROR") return fail("VALIDATION_ERROR", "بيانات الإنهاء غير صالحة", 400);
      if (e instanceof Error && e.message === "NOT_FOUND") return fail("NOT_FOUND", "التحويل غير موجود", 404);
      throw e;
    }
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
      scheduledDoseId: body.scheduledDoseId,
      vitalsJson: body.vitalsJson,
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

  if (resource === "canteen" && method === "GET" && pathname.includes("/staff-certificates")) {
    return ok(await prisma.canteenStaffHealthCertificate.findMany({ orderBy: { expiryDate: "asc" } }));
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

  if (resource === "psychology" && !canAccessPsychSocial(actor.role)) {
    return fail("FORBIDDEN", "لا صلاحية للوصول", 403);
  }
  if (resource === "social" && !canAccessPsychSocial(actor.role)) {
    return fail("FORBIDDEN", "لا صلاحية للوصول", 403);
  }

  if (resource === "psychology" && method === "GET") {
    const data = await prisma.psychologySession.findMany({ include: { student: true, assessments: true }, take: pageSize });
    return ok(data);
  }

  if (resource === "psychology" && method === "POST" && pathname.includes("/assessments")) {
    const body = await req.json();
    const created = await prisma.psychologicalAssessment.create({
      data: {
        sessionId: body.sessionId,
        tool: body.tool,
        score: body.score,
        responsesJson: body.responsesJson,
        notes: body.notes,
      },
    });
    return ok(created, undefined, 201);
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

  if (resource === "reports" && method === "GET" && pathname.includes("/export/medical")) {
    const buf = await exportMedicalExcel(actor.role, actor.clinicId);
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="medical-report.xlsx"',
      },
    });
  }
  if (resource === "reports" && method === "GET" && pathname.includes("/export/safety")) {
    const buf = await exportSafetyExcel();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="safety-report.xlsx"',
      },
    });
  }

  if (resource === "reports" && method === "GET") {
    return ok(await getReportsSummary(actor.role, actor.clinicId));
  }

  if (resource === "reports" && method === "POST") {
    await writeAudit({
      userId: actor.userId,
      actionType: "EXPORT",
      tableName: "reports",
      newValue: { format: (await req.json()).format },
    });
    return ok({ message: "استخدم GET /reports/export/medical أو /export/safety" });
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

  if (method === "GET" && (pathname.endsWith("/search") || req.nextUrl.searchParams.get("q") !== null)) {
    return ok(await advancedSearch(actor, req.nextUrl.searchParams));
  }

  return fail("NOT_IMPLEMENTED", `No handler for ${resource} ${method}`, 501);
}
