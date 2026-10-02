import { createHash } from "crypto";
import { prisma } from "@/lib/db";

export async function checkIdempotency(key: string | null, route: string) {
  if (!key) throw new Error("IDEMPOTENCY_REQUIRED");
  const existing = await prisma.idempotencyKey.findUnique({ where: { key } });
  if (existing && existing.route === route) {
    return { replay: true as const, responseHash: existing.responseHash };
  }
  await prisma.idempotencyKey.create({ data: { key, route } });
  return { replay: false as const };
}

export function hashResponse(body: unknown) {
  return createHash("sha256").update(JSON.stringify(body)).digest("hex");
}
