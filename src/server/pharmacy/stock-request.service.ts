import { prisma } from "@/lib/db";
import { assertClinicAccess, clinicFilter } from "@/lib/clinic-scope";
import { canManageMainInventory } from "@/lib/main-store";
import { nextSequence } from "@/lib/numbering";
import { writeAudit } from "@/lib/audit";
import type { ActorContext } from "@/server/context";
import { createStockRequestSchema, reviewStockRequestSchema } from "@/lib/validations/stock-request";
import type { Prisma, StockScope } from "@prisma/client";

type Tx = Prisma.TransactionClient;

function canReviewRequests(role: string) {
  return canManageMainInventory(role);
}

export async function listStockRequests(actor: ActorContext) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  const where =
    scope.clinicId != null
      ? { toClinicId: scope.clinicId }
      : canReviewRequests(actor.role)
        ? {}
        : { toClinicId: "00000000-0000-0000-0000-000000000000" };

  const rows = await prisma.internalStockRequest.findMany({
    where,
    include: {
      toClinic: { select: { name: true } },
      requestedBy: { select: { fullName: true } },
      reviewedBy: { select: { fullName: true } },
      lines: { include: { medication: { select: { name: true, unit: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return rows.map((r) => ({
    id: r.id,
    requestNumber: r.requestNumber,
    status: r.status,
    notes: r.notes,
    createdAt: r.createdAt,
    reviewedAt: r.reviewedAt,
    clinicName: r.toClinic.name,
    requestedByName: r.requestedBy.fullName,
    reviewedByName: r.reviewedBy?.fullName,
    lineCount: r.lines.length,
    lines: r.lines.map((l) => ({
      id: l.id,
      medicationId: l.medicationId,
      medicationName: l.medication.name,
      unit: l.medication.unit,
      quantityRequested: l.quantityRequested,
      quantityApproved: l.quantityApproved,
      quantityFulfilled: l.quantityFulfilled,
    })),
  }));
}

export async function createStockRequest(actor: ActorContext, raw: unknown) {
  const parsed = createStockRequestSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  if (!actor.clinicId) throw new Error("CLINIC_FORBIDDEN");

  const created = await prisma.$transaction(async (tx) => {
    const requestNumber = await nextSequence(tx, "ISR");
    const req = await tx.internalStockRequest.create({
      data: {
        requestNumber,
        toClinicId: actor.clinicId!,
        requestedById: actor.userId,
        notes: parsed.data.notes,
        status: "PENDING",
        lines: {
          create: parsed.data.lines.map((l) => ({
            medicationId: l.medicationId,
            quantityRequested: l.quantityRequested,
          })),
        },
      },
      include: { lines: true },
    });
    return req;
  });

  await writeAudit({
    userId: actor.userId,
    actionType: "CREATE",
    tableName: "internal_stock_requests",
    recordId: created.id,
    newValue: created,
  });

  return created;
}

export async function reviewStockRequest(actor: ActorContext, requestId: string, raw: unknown) {
  if (!canReviewRequests(actor.role)) throw new Error("FORBIDDEN");
  const parsed = reviewStockRequestSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");

  const req = await prisma.internalStockRequest.findUnique({
    where: { id: requestId },
    include: { lines: true },
  });
  if (!req) throw new Error("NOT_FOUND");
  if (req.status !== "PENDING") throw new Error("VALIDATION_ERROR");

  if (parsed.data.decision === "REJECTED") {
    const updated = await prisma.internalStockRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        reviewedById: actor.userId,
        reviewedAt: new Date(),
        notes: parsed.data.reviewNotes
          ? `${req.notes ?? ""}\n[رفض]: ${parsed.data.reviewNotes}`.trim()
          : req.notes,
      },
    });
    return updated;
  }

  const lineMap = new Map(parsed.data.lines?.map((l) => [l.lineId, l.quantityApproved]) ?? []);
  await prisma.$transaction(async (tx) => {
    for (const line of req.lines) {
      const approved = lineMap.get(line.id) ?? line.quantityRequested;
      await tx.internalStockRequestLine.update({
        where: { id: line.id },
        data: { quantityApproved: approved },
      });
    }
    await tx.internalStockRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: actor.userId,
        reviewedAt: new Date(),
      },
    });
  });

  return prisma.internalStockRequest.findUnique({
    where: { id: requestId },
    include: { lines: { include: { medication: true } } },
  });
}

async function deductFromMainBatches(
  tx: Tx,
  medicationId: string,
  qty: number,
) {
  let remaining = qty;
  const batches = await tx.medicationBatch.findMany({
    where: { medicationId, stockScope: "MAIN", quantity: { gt: 0 } },
    orderBy: { expiryDate: "asc" },
  });
  const deductions: { batchId: string; batchNumber: string; qty: number; expiryDate: Date }[] = [];
  for (const b of batches) {
    if (remaining <= 0) break;
    const take = Math.min(b.quantity, remaining);
    await tx.medicationBatch.update({
      where: { id: b.id },
      data: { quantity: { decrement: take } },
    });
    deductions.push({ batchId: b.id, batchNumber: b.batchNumber, qty: take, expiryDate: b.expiryDate });
    remaining -= take;
  }
  if (remaining > 0) throw new Error("INSUFFICIENT_STOCK");
  return deductions;
}

async function addToClinicBatch(
  tx: Tx,
  medicationId: string,
  clinicId: string,
  batchNumber: string,
  qty: number,
  expiryDate: Date,
) {
  const existing = await tx.medicationBatch.findFirst({
    where: {
      medicationId,
      stockScope: "CLINIC",
      clinicId,
      batchNumber,
    },
  });
  if (existing) {
    return tx.medicationBatch.update({
      where: { id: existing.id },
      data: { quantity: { increment: qty } },
    });
  }
  return tx.medicationBatch.create({
    data: {
      medicationId,
      batchNumber,
      quantity: qty,
      expiryDate,
      stockScope: "CLINIC",
      clinicId,
    },
  });
}

export async function fulfillStockRequest(actor: ActorContext, requestId: string) {
  if (!canManageMainInventory(actor.role)) throw new Error("FORBIDDEN");

  const req = await prisma.internalStockRequest.findUnique({
    where: { id: requestId },
    include: { lines: true },
  });
  if (!req) throw new Error("NOT_FOUND");
  if (req.status !== "APPROVED") throw new Error("VALIDATION_ERROR");

  await prisma.$transaction(async (tx) => {
    for (const line of req.lines) {
      const toFulfill = line.quantityApproved ?? line.quantityRequested;
      if (toFulfill <= 0) continue;

      const deductions = await deductFromMainBatches(tx, line.medicationId, toFulfill);
      for (const d of deductions) {
        await addToClinicBatch(
          tx,
          line.medicationId,
          req.toClinicId,
          d.batchNumber,
          d.qty,
          d.expiryDate,
        );
        await tx.inventoryTransaction.create({
          data: {
            medicationId: line.medicationId,
            transactionType: "TRANSFER",
            quantity: d.qty,
            batchNumber: d.batchNumber,
            fromClinicId: null,
            toClinicId: req.toClinicId,
            performedById: actor.userId,
            notes: `تلبية طلب ${req.requestNumber}`,
            approvedById: actor.userId,
          },
        });
      }

      await tx.internalStockRequestLine.update({
        where: { id: line.id },
        data: { quantityFulfilled: toFulfill },
      });
    }

    await tx.internalStockRequest.update({
      where: { id: requestId },
      data: { status: "FULFILLED" },
    });
  });

  return prisma.internalStockRequest.findUnique({
    where: { id: requestId },
    include: { lines: true, toClinic: true },
  });
}

export async function listMainInventory() {
  const batches = await prisma.medicationBatch.findMany({
    where: { stockScope: "MAIN", quantity: { gt: 0 } },
    include: { medication: { select: { name: true, unit: true, minQuantity: true } } },
    orderBy: [{ medicationId: "asc" }, { expiryDate: "asc" }],
  });
  return batches.map((b) => ({
    id: b.id,
    batchNumber: b.batchNumber,
    quantity: b.quantity,
    expiryDate: b.expiryDate,
    medicationId: b.medicationId,
    medicationName: b.medication.name,
    unit: b.medication.unit,
    stockScope: "MAIN" as StockScope,
    clinicName: "المخزن الرئيسي",
  }));
}
