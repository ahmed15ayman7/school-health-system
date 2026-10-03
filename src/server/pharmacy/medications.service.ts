import { prisma } from "@/lib/db";
import { assertClinicAccess, clinicFilter } from "@/lib/clinic-scope";
import { canManageMainInventory, getMainStoreClinicId } from "@/lib/main-store";
import { CENTRAL_ROLES } from "@/lib/rbac";
import type { ActorContext } from "@/server/context";
import { createMedicationSchema, stockInSchema } from "@/lib/validations/medication";
import { writeAudit } from "@/lib/audit";
import type { StockScope } from "@prisma/client";

export async function resolveMedicationClinicId(actor: ActorContext, requested?: string | null) {
  const mainId = await getMainStoreClinicId();
  if (CENTRAL_ROLES.includes(actor.role) || canManageMainInventory(actor.role)) {
    return mainId;
  }
  if (!actor.clinicId) throw new Error("CLINIC_FORBIDDEN");
  if (requested && requested !== actor.clinicId) throw new Error("CLINIC_FORBIDDEN");
  return actor.clinicId;
}

export async function createMedication(actor: ActorContext, raw: unknown) {
  const parsed = createMedicationSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const clinicId = await resolveMedicationClinicId(actor, parsed.data.clinicId);
  assertClinicAccess(actor.role, actor.clinicId, clinicId);

  const created = await prisma.medication.create({
    data: {
      name: parsed.data.name,
      activeIngredient: parsed.data.activeIngredient,
      category: parsed.data.category ?? "MEDICINE",
      dosageForm: parsed.data.dosageForm,
      concentration: parsed.data.concentration,
      unit: parsed.data.unit,
      minQuantity: parsed.data.minQuantity,
      supplier: parsed.data.supplier,
      storageLocation: parsed.data.storageLocation,
      clinicId,
    },
  });

  await writeAudit({
    userId: actor.userId,
    actionType: "CREATE",
    tableName: "medications",
    recordId: created.id,
    newValue: created,
  });

  return created;
}

/** استلام خارجي — للمخزن الرئيسي فقط */
export async function receiveStock(actor: ActorContext, raw: unknown) {
  if (!canManageMainInventory(actor.role)) throw new Error("FORBIDDEN");

  const parsed = stockInSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");

  const medication = await prisma.medication.findFirst({
    where: { id: parsed.data.medicationId, isDeleted: false },
  });
  if (!medication) throw new Error("NOT_FOUND");

  const expiry = new Date(parsed.data.expiryDate);
  if (Number.isNaN(expiry.getTime())) throw new Error("VALIDATION_ERROR");

  const result = await prisma.$transaction(async (tx) => {
    const txRecord = await tx.inventoryTransaction.create({
      data: {
        medicationId: medication.id,
        transactionType: "IN",
        quantity: parsed.data.quantity,
        batchNumber: parsed.data.batchNumber,
        toClinicId: null,
        performedById: actor.userId,
        notes: parsed.data.notes ?? "استلام مخزن رئيسي",
      },
    });
    const batch = await tx.medicationBatch.create({
      data: {
        medicationId: medication.id,
        batchNumber: parsed.data.batchNumber,
        quantity: parsed.data.quantity,
        expiryDate: expiry,
        stockScope: "MAIN",
        clinicId: null,
      },
    });
    return { txRecord, batch };
  });

  await writeAudit({
    userId: actor.userId,
    actionType: "CREATE",
    tableName: "inventory_transactions",
    recordId: result.txRecord.id,
    newValue: result,
  });

  return result;
}

function sumQty(batches: { quantity: number; stockScope: StockScope; clinicId: string | null }[], scope: StockScope, clinicId?: string | null) {
  return batches
    .filter((b) => b.stockScope === scope && (scope === "MAIN" || b.clinicId === clinicId))
    .reduce((s, b) => s + b.quantity, 0);
}

export async function listMedicationsForActor(actor: ActorContext) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  const rows = await prisma.medication.findMany({
    where: { isDeleted: false },
    include: { batches: true, clinic: { select: { name: true } } },
    orderBy: { name: "asc" },
  });

  const clinicIdForStock = actor.clinicId ?? scope.clinicId;

  return rows.map((m) => ({
    ...m,
    clinicName: m.clinic.name,
    mainStockQty: sumQty(m.batches, "MAIN"),
    clinicStockQty: sumQty(m.batches, "CLINIC", clinicIdForStock),
    stockQty: sumQty(m.batches, "CLINIC", clinicIdForStock),
    genericName: m.activeIngredient,
    form: m.dosageForm,
    strength: m.concentration,
  }));
}

export async function listClinicInventoryBatches(actor: ActorContext) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  const clinicId = scope.clinicId ?? actor.clinicId;
  if (!clinicId && !CENTRAL_ROLES.includes(actor.role) && !canManageMainInventory(actor.role)) {
    return [];
  }

  const batches = await prisma.medicationBatch.findMany({
    include: {
      medication: { include: { clinic: { select: { name: true } } } },
      clinic: { select: { name: true } },
    },
    where: {
      stockScope: "CLINIC",
      ...(clinicId ? { clinicId } : {}),
      medication: { isDeleted: false },
    },
    orderBy: [{ expiryDate: "asc" }],
  });

  return batches.map((b) => ({
    id: b.id,
    batchNumber: b.batchNumber,
    quantity: b.quantity,
    expiryDate: b.expiryDate,
    receivedAt: b.receivedAt,
    medicationId: b.medicationId,
    medicationName: b.medication.name,
    clinicName: b.clinic?.name ?? "—",
    unit: b.medication.unit,
    minQuantity: b.medication.minQuantity,
    stockScope: b.stockScope,
  }));
}
