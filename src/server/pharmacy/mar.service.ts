import { prisma } from "@/lib/db";
import { writeAudit } from "@/lib/audit";
import type { ActorContext } from "@/server/context";
import type { VisitorType, OwnerType } from "@prisma/client";

export async function administerMedication(input: {
  actor: ActorContext;
  visitorType: VisitorType;
  visitorId: string;
  medicationId: string;
  batchId?: string;
  dose: number;
  unit: string;
  reason?: string;
  allergyOverride?: boolean;
}) {
  const ownerType: OwnerType = input.visitorType === "STUDENT" ? "STUDENT" : "EMPLOYEE";
  const profile = await prisma.medicalProfile.findUnique({
    where: { ownerType_ownerId: { ownerType, ownerId: input.visitorId } },
    include: { allergies: true },
  });

  const med = await prisma.medication.findUnique({ where: { id: input.medicationId } });
  if (!med) throw new Error("MED_NOT_FOUND");

  const allergyHit = profile?.allergies.some((a) =>
    med.name.toLowerCase().includes(a.type.toLowerCase()) ||
    (med.activeIngredient?.toLowerCase().includes(a.type.toLowerCase()) ?? false),
  );

  if (allergyHit && !input.allergyOverride) {
    throw new Error("ALLERGY_CONFLICT");
  }

  return prisma.$transaction(async (tx) => {
    const batches = await tx.medicationBatch.findMany({
      where: { medicationId: input.medicationId, quantity: { gt: 0 } },
      orderBy: { expiryDate: "asc" },
    });

    const batchRow = input.batchId ? batches.find((b) => b.id === input.batchId) : batches[0];
    if (!batchRow || batchRow.quantity < 1) throw new Error("INSUFFICIENT_STOCK");

    const updatedBatch = await tx.medicationBatch.updateMany({
      where: { id: batchRow.id, quantity: { gte: 1 } },
      data: { quantity: { decrement: 1 } },
    });
    if (updatedBatch.count !== 1) throw new Error("INSUFFICIENT_STOCK");
    const batch = batchRow;

    const mar = await tx.medicationAdministration.create({
      data: {
        visitorType: input.visitorType,
        visitorId: input.visitorId,
        medicationId: input.medicationId,
        batchId: batch.id,
        dose: input.dose,
        unit: input.unit,
        administrationTime: new Date(),
        reason: input.reason,
        nurseId: input.actor.userId,
        allergyOverride: !!input.allergyOverride,
      },
    });

    await tx.inventoryTransaction.create({
      data: {
        medicationId: input.medicationId,
        transactionType: "OUT",
        quantity: 1,
        performedById: input.actor.userId,
        notes: "MAR auto deduct",
      },
    });

    await writeAudit(
      {
        userId: input.actor.userId,
        actionType: "MAR",
        tableName: "medication_administrations",
        recordId: mar.id,
        newValue: mar,
      },
      tx,
    );

    return mar;
  });
}
