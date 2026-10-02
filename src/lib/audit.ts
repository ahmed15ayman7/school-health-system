import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

type AuditInput = {
  userId?: string | null;
  actionType: string;
  tableName: string;
  recordId?: string | null;
  oldValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAudit(input: AuditInput, tx?: Prisma.TransactionClient) {
  const client = tx ?? prisma;
  return client.auditLog.create({
    data: {
      userId: input.userId ?? null,
      actionType: input.actionType,
      tableName: input.tableName,
      recordId: input.recordId ?? null,
      oldValueJson: input.oldValue as Prisma.InputJsonValue | undefined,
      newValueJson: input.newValue as Prisma.InputJsonValue | undefined,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
