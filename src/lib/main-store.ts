import { prisma } from "@/lib/db";

export async function getMainStoreClinicId() {
  const main = await prisma.clinic.findFirst({
    where: { isMainStore: true, isActive: true },
    select: { id: true },
  });
  if (main) return main.id;
  const fallback = await prisma.clinic.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  if (!fallback) throw new Error("NO_MAIN_STORE");
  return fallback.id;
}

export function canManageMainInventory(role: string) {
  return role === "SUPER_ADMIN" || role === "MEDICAL_MANAGER" || role === "PHARMACY";
}
