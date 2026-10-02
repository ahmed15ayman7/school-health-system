import { prisma } from "@/lib/db";
import type { ActorContext } from "@/server/context";
import { clinicFilter } from "@/lib/clinic-scope";

export async function advancedSearch(actor: ActorContext, params: URLSearchParams) {
  const scope = clinicFilter(actor.role, actor.clinicId);
  const q = params.get("q") ?? "";
  const type = params.get("type");
  const grade = params.get("grade");
  const clinicId = params.get("clinicId") ?? scope.clinicId;

  const studentWhere = {
    ...scope,
    isDeleted: false,
    ...(clinicId ? { clinicId } : {}),
    ...(grade ? { grade } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { academicNumber: { contains: q } },
            { qrCode: { contains: q } },
          ],
        }
      : {}),
  };

  const students =
    type === "employee"
      ? []
      : await prisma.student.findMany({ where: studentWhere, take: 20 });

  const employees =
    type === "student"
      ? []
      : await prisma.employee.findMany({
          where: {
            ...scope,
            isDeleted: false,
            ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
          },
          take: 20,
        });

  return { students, employees };
}
