import { PrismaClient } from "@prisma/client";
import { softDeleteExtension } from "@/lib/db-soft-delete";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrisma() {
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  }).$extends(softDeleteExtension());
}

export const prisma = (globalForPrisma.prisma ?? createPrisma()) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma as unknown as PrismaClient;
}
