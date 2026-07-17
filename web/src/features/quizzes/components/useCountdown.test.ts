import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useCountdown } from "./useCountdown";

describe("useCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts down from the given number of seconds", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(10, onExpire));

    expect(result.current.secondsLeft).toBe(10);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.secondsLeft).toBe(7);
    expect(onExpire).not.toHaveBeenCalled();
  });

  it("calls onExpire exactly once when it reaches zero", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    const { result } = renderHook(() => useCountdown(3, onExpire));

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.secondsLeft).toBe(0);
    expect(onExpire).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it("formats seconds as m:ss", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCountdown(65, vi.fn()));
    expect(result.current.formatted).toBe("1:05");
  });

  it("does nothing when totalSeconds is null (untimed quiz)", () => {
    vi.useFakeTimers();
    const onExpire = vi.fn();
    renderHook(() => useCountdown(null, onExpire));

    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(onExpire).not.toHaveBeenCalled();
  });
});
