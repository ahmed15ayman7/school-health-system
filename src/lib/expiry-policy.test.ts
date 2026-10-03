import { describe, expect, it } from "vitest";
import { expiryTier, isDispenseBlocked } from "./expiry-policy";

describe("expiry-policy", () => {
  it("blocks within 30 days", () => {
    const d = new Date(Date.now() + 20 * 86400000);
    expect(isDispenseBlocked(d)).toBe(true);
    expect(expiryTier(d)).toBe("critical");
  });
  it("warns within 90 days", () => {
    const d = new Date(Date.now() + 60 * 86400000);
    expect(expiryTier(d)).toBe("warn");
    expect(isDispenseBlocked(d)).toBe(false);
  });
});
