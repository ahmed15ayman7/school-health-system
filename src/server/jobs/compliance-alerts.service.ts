import { prisma } from "@/lib/db";
import { notificationChannel } from "@/server/notifications/channels";
import { expiryTier } from "@/lib/expiry-policy";

function daysUntil(d: Date) {
  return Math.ceil((d.getTime() - Date.now()) / 86400000);
}

export async function runComplianceAlerts() {
  let created = 0;
  const now = new Date();

  const waterDue = await prisma.waterQualityTest.findMany({
    where: { nextDueDate: { lte: new Date(now.getTime() + 30 * 86400000) } },
  });
  for (const w of waterDue) {
    const ehs = await prisma.user.findMany({ where: { role: "EHS_OFFICER", isActive: true } });
    for (const u of ehs) {
      await notificationChannel.sendInApp({
        userId: u.id,
        type: "PERIODIC_CHECK",
        title: "فحص مياه مستحق",
        message: `${w.siteName} — متبقي ${daysUntil(w.nextDueDate)} يوم`,
        link: "/safety/water",
      });
      created++;
    }
  }

  const licenses = await prisma.professionalLicense.findMany({
    where: { expiryDate: { lte: new Date(now.getTime() + 60 * 86400000) } },
  });
  for (const lic of licenses) {
    const d = daysUntil(lic.expiryDate);
    if (![60, 30, 15].some((x) => d <= x && d >= x - 1)) continue;
    const ehs = await prisma.user.findMany({ where: { role: { in: ["EHS_OFFICER", "MEDICAL_MANAGER"] }, isActive: true } });
    for (const u of ehs) {
      await notificationChannel.sendInApp({
        userId: u.id,
        type: "PERIODIC_CHECK",
        title: "ترخيص ينتهي قريباً",
        message: `${lic.holderName} — ${d} يوم`,
        link: "/safety/licenses",
      });
      created++;
    }
  }

  const certs = await prisma.canteenStaffHealthCertificate.findMany({
    where: { expiryDate: { lt: now } },
  });
  for (const c of certs) {
    if (!c.blockWork) {
      await prisma.canteenStaffHealthCertificate.update({ where: { id: c.id }, data: { blockWork: true } });
    }
  }

  const batches = await prisma.medicationBatch.findMany({ where: { quantity: { gt: 0 } } });
  for (const b of batches) {
    const tier = expiryTier(b.expiryDate);
    if (tier === "warn" || tier === "critical") {
      const ph = await prisma.user.findMany({ where: { role: { in: ["PHARMACY", "MEDICAL_MANAGER"] }, isActive: true } });
      for (const u of ph) {
        await notificationChannel.sendInApp({
          userId: u.id,
          type: "EXPIRY",
          title: tier === "critical" ? "انتهاء صلاحية حرج" : "انتهاء صلاحية قريب",
          message: `دفعة ${b.batchNumber} — ${daysUntil(b.expiryDate)} يوم`,
          link: "/inventory/alerts",
        });
        created++;
      }
    }
  }

  return { notifications: created, blockedCerts: certs.length };
}
