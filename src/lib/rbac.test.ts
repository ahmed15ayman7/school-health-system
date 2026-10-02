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
});
