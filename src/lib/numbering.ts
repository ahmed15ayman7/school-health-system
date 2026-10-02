import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

const PREFIX: Record<string, string> = {
  VIS: "VIS",
  EMG: "EMG",
  REF: "REF",
  PSY: "PSY",
  SOC: "SOC",
};

export async function nextSequence(tx: Tx, scope: keyof typeof PREFIX | string, year?: number) {
  const y = year ?? new Date().getFullYear();
  const counter = await tx.counter.upsert({
    where: { scope_year: { scope, year: y } },
    create: { scope, year: y, value: 1 },
    update: { value: { increment: 1 } },
  });
  const prefix = PREFIX[scope] ?? scope;
  const padded = String(counter.value).padStart(6, "0");
  return `${prefix}-${y}-${padded}`;
}
