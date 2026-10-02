import { describe, expect, it } from "vitest";
import { referralIsLate } from "./referral-utils";

describe("referralIsLate", () => {
  it("flags pending over 15 minutes", () => {
    const t = new Date("2026-01-01T10:00:00Z");
    const now = new Date("2026-01-01T10:20:00Z");
    expect(referralIsLate({ status: "PENDING", referralTime: t }, now)).toBe(true);
  });

  it("ignores completed", () => {
    expect(referralIsLate({ status: "COMPLETED", referralTime: new Date() })).toBe(false);
  });
});
