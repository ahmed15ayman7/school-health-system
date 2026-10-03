import { describe, expect, it } from "vitest";
import { can } from "./rbac";

describe("rbac", () => {
  it("allows nurse to create visits", () => {
    expect(can("NURSE", "visits", "create")).toBe(true);
  });
  it("denies teacher from mar", () => {
    expect(can("TEACHER", "mar", "create")).toBe(false);
  });
  it("allows HR to approve recommendations", () => {
    expect(can("HR", "recommendations", "approve")).toBe(true);
  });
  it("denies EHS from psychology", () => {
    expect(can("EHS_OFFICER", "psychology", "read")).toBe(false);
  });
  it("allows EHS safety export", () => {
    expect(can("EHS_OFFICER", "safety", "export")).toBe(true);
  });
  it("executive reads reports only scope", () => {
    expect(can("EXECUTIVE", "health_profiles", "read")).toBe(false);
    expect(can("EXECUTIVE", "reports", "read")).toBe(true);
  });
});
