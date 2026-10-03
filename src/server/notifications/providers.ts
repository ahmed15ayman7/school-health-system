import type { OutboundChannel } from "@prisma/client";

export async function sendExternalMessage(
  channel: OutboundChannel,
  recipient: string,
  body: string,
): Promise<"SENT" | "SIMULATED" | "FAILED"> {
  const url = channel === "SMS" ? process.env.SMS_API_URL : process.env.WHATSAPP_API_URL;
  const key = process.env.SMS_API_KEY ?? process.env.WHATSAPP_API_KEY;
  if (!url || !key) return "SIMULATED";
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ to: recipient, message: body, channel }),
    });
    return res.ok ? "SENT" : "FAILED";
  } catch {
    return "FAILED";
  }
}
