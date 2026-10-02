import type { StudentReferral } from "@prisma/client";
import { referralIsLate as isLate } from "@/lib/referral-utils";

export function referralIsLate(
  ref: Pick<StudentReferral, "status" | "referralTime">,
  now = new Date(),
): boolean {
  return isLate(ref, now);
}

export function computeWaitingMinutes(receivedTime: Date, referralTime: Date): number {
  return Math.round((receivedTime.getTime() - referralTime.getTime()) / 60000);
}
