export function referralIsLate(
  ref: { status: string; referralTime: string | Date },
  now = new Date(),
): boolean {
  if (ref.status !== "PENDING") return false;
  const t = typeof ref.referralTime === "string" ? new Date(ref.referralTime) : ref.referralTime;
  return now.getTime() - t.getTime() > 15 * 60 * 1000;
}
