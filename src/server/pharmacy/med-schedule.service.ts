import { prisma } from "@/lib/db";
import { notificationChannel } from "@/server/notifications/channels";
import type { ActorContext } from "@/server/context";
import { clinicFilter } from "@/lib/clinic-scope";

type ScheduleJson = { times: string[]; daysOfWeek?: number[] };

export async function listTodayDoses(actor: ActorContext) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const scope = clinicFilter(actor.role, actor.clinicId);
  const orders = await prisma.studentMedicationOrder.findMany({
    where: {
      isActive: true,
      student: scope.clinicId ? { clinicId: scope.clinicId } : undefined,
    },
    include: {
      student: { select: { id: true, name: true, clinicId: true } },
      doses: { where: { dueAt: { gte: start, lt: end } } },
    },
  });
  return orders.flatMap((o) =>
    o.doses.map((d) => ({
      ...d,
      studentName: o.student.name,
      medicationName: o.medicationName,
      doseAmount: o.dose,
      unit: o.unit,
    })),
  );
}

export async function createMedicationOrder(actor: ActorContext, body: Record<string, unknown>) {
  const order = await prisma.studentMedicationOrder.create({
    data: {
      studentId: String(body.studentId),
      medicationName: String(body.medicationName),
      dose: String(body.dose),
      unit: String(body.unit),
      scheduleJson: (body.scheduleJson ?? { times: [] }) as object,
      requiresVitalsJson: (body.requiresVitalsJson ?? {}) as object,
      createdById: actor.userId,
    },
  });
  await generateDosesForOrder(order.id, order.scheduleJson as ScheduleJson);
  return order;
}

export async function generateDosesForOrder(orderId: string, schedule: ScheduleJson) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  if (schedule.daysOfWeek?.length && !schedule.daysOfWeek.includes(dow)) return;
  for (const t of schedule.times ?? []) {
    const [h, m] = t.split(":").map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) continue;
    const dueAt = new Date(today);
    dueAt.setHours(h!, m!, 0, 0);
    await prisma.scheduledDose.create({
      data: { orderId, dueAt, status: "PENDING" },
    });
  }
}

export async function runDoseReminders() {
  const now = new Date();
  const in15 = new Date(now.getTime() + 15 * 60 * 1000);
  const windowEnd = new Date(in15.getTime() + 60 * 1000);
  const due = await prisma.scheduledDose.findMany({
    where: {
      status: { in: ["PENDING", "DUE"] },
      remindedAt: null,
      dueAt: { gte: in15, lte: windowEnd },
    },
    include: { order: { include: { student: true } } },
  });
  for (const d of due) {
    const nurses = await prisma.user.findMany({
      where: {
        role: { in: ["NURSE", "HEAD_NURSE"] },
        isActive: true,
        clinicId: d.order.student.clinicId,
      },
    });
    const admins = await prisma.user.findMany({
      where: { role: { in: ["SCHOOL_ADMIN", "DEPUTY_ADMIN"] }, isActive: true },
    });
    const msg = `جرعة ${d.order.medicationName} للطالب ${d.order.student.name} خلال 15 دقيقة`;
    for (const u of [...nurses, ...admins]) {
      await notificationChannel.sendInApp({
        userId: u.id,
        type: "MED_DOSE_REMINDER",
        title: "تذكير جرعة",
        message: msg,
        link: "/medications/doses",
      });
    }
    await prisma.scheduledDose.update({ where: { id: d.id }, data: { remindedAt: new Date(), status: "DUE" } });
  }
  return { reminded: due.length };
}

export async function markDoseAdministered(doseId: string, marId: string) {
  await prisma.scheduledDose.update({
    where: { id: doseId },
    data: { status: "ADMINISTERED" },
  });
  await prisma.medicationAdministration.update({
    where: { id: marId },
    data: { scheduledDoseId: doseId },
  });
}
