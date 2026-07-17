import { describe, it, expect, vi, afterEach } from "vitest";
import { durationFromNow } from "./duration";

describe("durationFromNow", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("parses minutes correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const result = durationFromNow("15m");
    expect(result.toISOString()).toBe("2026-01-01T00:15:00.000Z");
  });

  it("parses days correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const result = durationFromNow("30d");
    expect(result.toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });

  it("parses hours correctly", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const result = durationFromNow("1h");
    expect(result.toISOString()).toBe("2026-01-01T01:00:00.000Z");
  });

  it("throws on an invalid format", () => {
    expect(() => durationFromNow("banana")).toThrow();
    expect(() => durationFromNow("15")).toThrow();
    expect(() => durationFromNow("15x")).toThrow();
  });
});
