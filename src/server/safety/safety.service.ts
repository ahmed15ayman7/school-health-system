import { prisma } from "@/lib/db";
import type { ActorContext } from "@/server/context";
import { clinicFilter } from "@/lib/clinic-scope";

export async function listSafetyInspections(actor: ActorContext, take = 50) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  return prisma.safetyInspection.findMany({
    where: scope.clinicId ? { clinicId: scope.clinicId } : {},
    orderBy: { inspectionDate: "desc" },
    take,
    include: { inspector: { select: { fullName: true } } },
  });
}

export async function listAedDevices(actor: ActorContext) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  return prisma.aedDevice.findMany({
    where: scope.clinicId ? { clinicId: scope.clinicId } : {},
    orderBy: { location: "asc" },
  });
}

export async function listFirstAidKits(actor: ActorContext) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  return prisma.firstAidKit.findMany({
    where: scope.clinicId ? { clinicId: scope.clinicId } : {},
    include: { items: true },
  });
}

export async function listScienceLabs(actor: ActorContext) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  return prisma.scienceLab.findMany({
    where: scope.clinicId ? { clinicId: scope.clinicId } : {},
    include: { assets: true, chemicals: true },
  });
}

export async function listWaterTests() {
  return prisma.waterQualityTest.findMany({ orderBy: { nextDueDate: "asc" }, take: 100 });
}

export async function listLicenses() {
  return prisma.professionalLicense.findMany({ orderBy: { expiryDate: "asc" }, take: 100 });
}

export async function listLabChemicals(actor: ActorContext) {
  const labs = await listScienceLabs(actor);
  return labs.flatMap((l) => l.chemicals.map((c) => ({ ...c, labName: l.name })));
}

export async function createSafetyInspection(actor: ActorContext, body: Record<string, unknown>) {
  return prisma.safetyInspection.create({
    data: {
      clinicId: (body.clinicId as string) ?? actor.clinicId ?? undefined,
      inspectionType: body.inspectionType as never,
      location: String(body.location ?? ""),
      inspectorId: actor.userId,
      checklistJson: (body.checklistJson ?? {}) as object,
      result: String(body.result ?? "pending"),
      notes: body.notes as string | undefined,
      inspectionDate: body.inspectionDate ? new Date(String(body.inspectionDate)) : new Date(),
      nextDueDate: body.nextDueDate ? new Date(String(body.nextDueDate)) : undefined,
    },
  });
}
