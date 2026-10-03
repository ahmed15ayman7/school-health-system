import { prisma } from "@/lib/db";
import { assertClinicAccess, clinicFilter } from "@/lib/clinic-scope";
import { CENTRAL_ROLES } from "@/lib/rbac";
import type { ActorContext } from "@/server/context";
import { createMedicationSchema, stockInSchema } from "@/lib/validations/medication";
import { writeAudit } from "@/lib/audit";

export function resolveMedicationClinicId(actor: ActorContext, requested?: string | null) {
  if (CENTRAL_ROLES.includes(actor.role)) {
    if (!requested) throw new Error("VALIDATION_ERROR");
    return requested;
  }
  if (!actor.clinicId) throw new Error("CLINIC_FORBIDDEN");
  if (requested && requested !== actor.clinicId) throw new Error("CLINIC_FORBIDDEN");
  return actor.clinicId;
}

export async function createMedication(actor: ActorContext, raw: unknown) {
  const parsed = createMedicationSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");
  const clinicId = resolveMedicationClinicId(actor, parsed.data.clinicId);
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

export async function receiveStock(actor: ActorContext, raw: unknown) {
  const parsed = stockInSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_ERROR");

  const medication = await prisma.medication.findFirst({
    where: { id: parsed.data.medicationId, isDeleted: false },
  });
  if (!medication) throw new Error("NOT_FOUND");
  assertClinicAccess(actor.role, actor.clinicId, medication.clinicId);

  const expiry = new Date(parsed.data.expiryDate);
  if (Number.isNaN(expiry.getTime())) throw new Error("VALIDATION_ERROR");

  const result = await prisma.$transaction(async (tx) => {
    const txRecord = await tx.inventoryTransaction.create({
      data: {
        medicationId: medication.id,
        transactionType: "IN",
        quantity: parsed.data.quantity,
        batchNumber: parsed.data.batchNumber,
        toClinicId: medication.clinicId,
        performedById: actor.userId,
        notes: parsed.data.notes,
      },
    });
    const batch = await tx.medicationBatch.create({
      data: {
        medicationId: medication.id,
        batchNumber: parsed.data.batchNumber,
        quantity: parsed.data.quantity,
        expiryDate: expiry,
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

export async function listMedicationsForActor(actor: ActorContext) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  const rows = await prisma.medication.findMany({
    where: { ...scope, isDeleted: false },
    include: { batches: true, clinic: { select: { name: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map((m) => ({
    ...m,
    clinicName: m.clinic.name,
    stockQty: m.batches.reduce((sum, b) => sum + b.quantity, 0),
    genericName: m.activeIngredient,
    form: m.dosageForm,
    strength: m.concentration,
  }));
}

export async function listInventoryBatches(actor: ActorContext) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  const batches = await prisma.medicationBatch.findMany({
    include: {
      medication: { include: { clinic: { select: { name: true } } } },
    },
    where: scope.clinicId ? { medication: { clinicId: scope.clinicId, isDeleted: false } } : { medication: { isDeleted: false } },
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
    clinicName: b.medication.clinic.name,
    unit: b.medication.unit,
    minQuantity: b.medication.minQuantity,
  }));
}
