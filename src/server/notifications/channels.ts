import { prisma } from "@/lib/db";
import type { NotificationType, OutboundChannel, OutboundMessageStatus } from "@prisma/client";
import { sendExternalMessage } from "@/server/notifications/providers";

export type NotifyPayload = {
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
};

export interface NotificationChannel {
  sendInApp(payload: NotifyPayload): Promise<void>;
  sendOutbound(channel: OutboundChannel, recipient: string, body: string, metadata?: object): Promise<void>;
}

class DefaultNotificationChannel implements NotificationChannel {
  async sendInApp(payload: NotifyPayload) {
    if (!payload.userId) return;
    await prisma.notification.create({
      data: {
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        link: payload.link,
      },
    });
  }

  async sendOutbound(channel: OutboundChannel, recipient: string, body: string, metadata?: object) {
    const result = await sendExternalMessage(channel, recipient, body);
    const status: OutboundMessageStatus =
      result === "SENT" ? "SENT" : result === "FAILED" ? "FAILED" : "SIMULATED";
    await prisma.outboundMessage.create({
      data: {
        channel,
        recipient,
        body,
        status,
        metadata: metadata ?? {},
      },
    });
  }
}

export const notificationChannel: NotificationChannel = new DefaultNotificationChannel();

export async function notifyGuardianOnReferralComplete(params: {
  studentName: string;
  guardianPhone: string;
  summary: string;
  prefs?: { sms?: boolean; whatsapp?: boolean; email?: boolean };
}) {
  const body = `مدارس الأندلس - العيادة: ${params.studentName} — ${params.summary}`;
  if (params.prefs?.sms !== false) {
    await notificationChannel.sendOutbound("SMS", params.guardianPhone, body, { kind: "referral_complete" });
  }
  if (params.prefs?.whatsapp) {
    await notificationChannel.sendOutbound("WHATSAPP", params.guardianPhone, body, { kind: "referral_complete" });
  }
}
