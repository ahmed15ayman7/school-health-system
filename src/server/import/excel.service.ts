import { prisma } from "@/lib/db";
import type { ImportJobStatus } from "@prisma/client";

export async function parseStudentImport(rows: Record<string, unknown>[], userId: string) {
  const job = await prisma.importJob.create({
    data: {
      userId,
      entityType: "students",
      fileName: "upload",
      status: "PROCESSING" as ImportJobStatus,
      totalRows: rows.length,
      startedAt: new Date(),
    },
  });

  let created = 0;
  let updated = 0;
  let rejected = 0;
  const errors: { row: number; reason: string }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]!;
    const academicNumber = String(row.academic_number ?? row["رقم القيد"] ?? "").trim();
    const name = String(row.name ?? row["الاسم"] ?? "").trim();
    const clinicId = String(row.clinic_id ?? "").trim();
    const guardianPhone = String(row.guardian_phone ?? row["هاتف ولي الأمر"] ?? "").trim();

    if (!academicNumber || !name || !clinicId || !guardianPhone) {
      rejected++;
      errors.push({ row: i + 1, reason: "بيانات ناقصة" });
      await prisma.importError.create({
        data: { jobId: job.id, rowNumber: i + 1, reason: "بيانات ناقصة", rowData: row as object },
      });
      continue;
    }

    const existing = await prisma.student.findUnique({ where: { academicNumber } });
    if (existing) {
      await prisma.student.update({
        where: { id: existing.id },
        data: { name, guardianPhone, grade: String(row.grade ?? existing.grade), class: String(row.class ?? existing.class) },
      });
      updated++;
    } else {
      await prisma.student.create({
        data: {
          academicNumber,
          qrCode: `STU-${academicNumber}`,
          name,
          grade: String(row.grade ?? "—"),
          class: String(row.class ?? "—"),
          clinicId,
          guardianName: String(row.guardian_name ?? "ولي أمر"),
          guardianPhone,
        },
      });
      created++;
    }
  }

  await prisma.importJob.update({
    where: { id: job.id },
    data: {
      status: "COMPLETED",
      createdCount: created,
      updatedCount: updated,
      rejectedCount: rejected,
      completedAt: new Date(),
    },
  });

  return { jobId: job.id, created, updated, rejected, errors };
}
