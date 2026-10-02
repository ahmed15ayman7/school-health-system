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
    const locked = await tx.$queryRaw<{ id: string; quantity: number }[]>`
      SELECT id, quantity FROM medication_batches
      WHERE medication_id = ${input.medicationId}::uuid AND quantity > 0
      ORDER BY expiry_date ASC
      FOR UPDATE
    `;
    const batchRow = input.batchId
      ? locked.find((b) => b.id === input.batchId)
      : locked[0];
    if (!batchRow || batchRow.quantity < 1) throw new Error("INSUFFICIENT_STOCK");

    await tx.medicationBatch.update({
      where: { id: batchRow.id },
      data: { quantity: { decrement: 1 } },
    });
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
