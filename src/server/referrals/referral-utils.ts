import type { StudentReferral } from "@prisma/client";

export function referralIsLate(
  ref: Pick<StudentReferral, "status" | "referralTime">,
  now = new Date(),
): boolean {
  if (ref.status !== "PENDING") return false;
  return now.getTime() - ref.referralTime.getTime() > 15 * 60 * 1000;
}

export function computeWaitingMinutes(receivedTime: Date, referralTime: Date): number {
  return Math.round((receivedTime.getTime() - referralTime.getTime()) / 60000);
}
