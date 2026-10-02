import { prisma } from "@/lib/db";
import type { UserRole } from "@prisma/client";
import { clinicFilter } from "@/lib/clinic-scope";

export async function getVisitsLast7Days(role: UserRole, clinicId: string | null | undefined) {
  const scope = clinicFilter(role, clinicId);
  const start = new Date();
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const visits = await prisma.visit.findMany({
    where: { ...scope, dateTime: { gte: start }, isDeleted: false },
    select: { dateTime: true },
  });

  const buckets: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const v of visits) {
    const key = v.dateTime.toISOString().slice(0, 10);
    if (key in buckets) buckets[key]++;
  }
  return Object.entries(buckets).map(([day, count]) => ({ day: day.slice(5), count }));
}
