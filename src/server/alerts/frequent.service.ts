import { prisma } from "@/lib/db";

export async function detectFrequentVisitors() {
  const monthAgo = new Date();
  monthAgo.setDate(monthAgo.getDate() - 30);

  const visits = await prisma.visit.groupBy({
    by: ["visitorId"],
    where: {
      visitorType: "STUDENT",
      dateTime: { gte: monthAgo },
      isDeleted: false,
    },
    _count: { id: true },
    having: { id: { _count: { gte: 3 } } },
  });

  const alerts = [];
  for (const v of visits) {
    const existing = await prisma.frequentVisitorAlert.findFirst({
      where: { studentId: v.visitorId, periodStart: { gte: monthAgo }, acknowledged: false },
    });
    if (existing) {
      alerts.push(existing);
      continue;
    }
    const created = await prisma.frequentVisitorAlert.create({
      data: {
        studentId: v.visitorId,
        visitCount: v._count.id,
        periodStart: monthAgo,
        periodEnd: new Date(),
        periodType: "month",
      },
    });
    alerts.push(created);
  }
  return alerts;
}
