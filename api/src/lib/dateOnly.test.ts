import { describe, it, expect } from "vitest";
import { toDateOnlyUTC, daysBetweenUTC } from "./dateOnly";

describe("dateOnly", () => {
  it("truncates a Date to midnight UTC", () => {
    const d = new Date("2026-03-15T18:42:07.123Z");
    const truncated = toDateOnlyUTC(d);
    expect(truncated.toISOString()).toBe("2026-03-15T00:00:00.000Z");
  });

  it("computes 0 days between two times on the same UTC calendar day", () => {
    const a = new Date("2026-03-15T01:00:00Z");
    const b = new Date("2026-03-15T23:59:00Z");
    expect(daysBetweenUTC(a, b)).toBe(0);
  });

  it("computes 1 day between consecutive calendar days regardless of time-of-day", () => {
    const a = new Date("2026-03-15T23:00:00Z");
    const b = new Date("2026-03-16T01:00:00Z");
    expect(daysBetweenUTC(a, b)).toBe(1);
  });

  it("computes a larger gap correctly", () => {
    const a = new Date("2026-03-10T00:00:00Z");
    const b = new Date("2026-03-17T00:00:00Z");
    expect(daysBetweenUTC(a, b)).toBe(7);
  });
});
