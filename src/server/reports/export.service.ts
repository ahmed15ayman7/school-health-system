import ExcelJS from "exceljs";
import { prisma } from "@/lib/db";
import { clinicFilter } from "@/lib/clinic-scope";
import type { UserRole } from "@prisma/client";

export async function exportMedicalExcel(role: UserRole, clinicId: string | null | undefined) {
  const scope = clinicFilter(role, clinicId);
  const visits = await prisma.visit.findMany({
    where: { ...scope, isDeleted: false },
    orderBy: { dateTime: "desc" },
    take: 5000,
  });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Visits");
  ws.addRow(["visitNumber", "dateTime", "triageLevel", "status"]);
  for (const v of visits) {
    ws.addRow([v.visitNumber, v.dateTime.toISOString(), v.triageLevel, v.status]);
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}

export async function exportSafetyExcel() {
  const rows = await prisma.safetyInspection.findMany({ orderBy: { inspectionDate: "desc" }, take: 2000 });
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Safety");
  ws.addRow(["type", "location", "date", "result"]);
  for (const r of rows) {
    ws.addRow([r.inspectionType, r.location, r.inspectionDate.toISOString(), r.result]);
  }
  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf);
}
