// Traceability: rt-8-filter-search-lists
// PROP 1 -> it('returns initial value immediately on mount')
// PROP 2 -> it('returns debounced value after delay elapses')
// PROP 2 -> it('resets timer and returns latest value when input changes rapidly before delay')

import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebounce } from "./use-debounce";

describe("useDebounce", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("good cases", () => {
    it("returns initial value immediately on mount", () => {
      const { result } = renderHook(() => useDebounce("hello", 300));
      expect(result.current).toBe("hello");
    });

    it("returns debounced value after delay elapses", () => {
      vi.useFakeTimers();
      const { result, rerender } = renderHook(
        ({ value, delay }: { value: string; delay: number }) =>
          useDebounce(value, delay),
        { initialProps: { value: "initial", delay: 300 } }
      );

      expect(result.current).toBe("initial");

      rerender({ value: "updated", delay: 300 });
      // Before delay: still old value
      expect(result.current).toBe("initial");

      act(() => {
        vi.advanceTimersByTime(300);
      });

      expect(result.current).toBe("updated");
    });
  });

  describe("bad cases", () => {
    it("does not update the value before delay elapses", () => {
      vi.useFakeTimers();
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300),
        { initialProps: { value: "original" } }
      );

      rerender({ value: "changed" });
      act(() => { vi.advanceTimersByTime(299); });

      expect(result.current).toBe("original");
    });
  });

  describe("edge cases", () => {
    it("resets timer and returns latest value when input changes rapidly before delay", () => {
      vi.useFakeTimers();
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useDebounce(value, 300),
        { initialProps: { value: "a" } }
      );

      rerender({ value: "ab" });
      act(() => { vi.advanceTimersByTime(100); });
      rerender({ value: "abc" });
      act(() => { vi.advanceTimersByTime(100); });
      rerender({ value: "abcd" });

      // Still old value — none of the timeouts have completed
      expect(result.current).toBe("a");

      act(() => { vi.advanceTimersByTime(300); });

      // Only the last value debounces through
      expect(result.current).toBe("abcd");
    });
  });
});
