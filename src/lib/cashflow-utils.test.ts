// Traceability: finance-cashflow (issue #126)

import { describe, it, expect } from "vitest";
import { calculateNetIncome } from "./cashflow-utils";
import { createCashflowEntry } from "@/test/fixtures/cashflow";

describe("calculateNetIncome", () => {
  describe("good cases", () => {
    it("returns sum of incomes minus sum of expenses", () => {
      const entries = [
        createCashflowEntry({ type: "income", amount: 1_000_000 }),
        createCashflowEntry({ type: "income", amount: 500_000 }),
        createCashflowEntry({ type: "expense", amount: 200_000 }),
      ];
      expect(calculateNetIncome(entries)).toBe(1_300_000);
    });

    it("returns positive number when income exceeds expenses", () => {
      const entries = [
        createCashflowEntry({ type: "income", amount: 800_000 }),
        createCashflowEntry({ type: "expense", amount: 100_000 }),
      ];
      expect(calculateNetIncome(entries)).toBeGreaterThan(0);
    });

    it("returns negative number when expenses exceed income", () => {
      const entries = [
        createCashflowEntry({ type: "income", amount: 50_000 }),
        createCashflowEntry({ type: "expense", amount: 300_000 }),
      ];
      expect(calculateNetIncome(entries)).toBe(-250_000);
    });

    it("returns exact income total when no expenses exist", () => {
      const entries = [
        createCashflowEntry({ type: "income", amount: 400_000 }),
        createCashflowEntry({ type: "income", amount: 600_000 }),
      ];
      expect(calculateNetIncome(entries)).toBe(1_000_000);
    });

    it("returns exact negative total when no income entries exist", () => {
      const entries = [
        createCashflowEntry({ type: "expense", amount: 75_000 }),
        createCashflowEntry({ type: "expense", amount: 25_000 }),
      ];
      expect(calculateNetIncome(entries)).toBe(-100_000);
    });
  });

  describe("bad cases", () => {
    it("returns 0 for empty entries array", () => {
      expect(calculateNetIncome([])).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("returns 0 when income exactly equals expenses", () => {
      const entries = [
        createCashflowEntry({ type: "income", amount: 500_000 }),
        createCashflowEntry({ type: "expense", amount: 500_000 }),
      ];
      expect(calculateNetIncome(entries)).toBe(0);
    });

    it("handles a single income entry", () => {
      const entries = [createCashflowEntry({ type: "income", amount: 1 })];
      expect(calculateNetIncome(entries)).toBe(1);
    });

    it("handles a single expense entry", () => {
      const entries = [createCashflowEntry({ type: "expense", amount: 1 })];
      expect(calculateNetIncome(entries)).toBe(-1);
    });

    it("handles large amounts without precision loss", () => {
      const entries = [
        createCashflowEntry({ type: "income", amount: 9_999_999 }),
        createCashflowEntry({ type: "expense", amount: 1 }),
      ];
      expect(calculateNetIncome(entries)).toBe(9_999_998);
    });

    it("accumulates correctly over many entries", () => {
      const entries = Array.from({ length: 100 }, (_, i) =>
        createCashflowEntry({ type: i % 2 === 0 ? "income" : "expense", amount: 1_000 })
      );
      // 50 income × 1000 − 50 expense × 1000 = 0
      expect(calculateNetIncome(entries)).toBe(0);
    });
  });
});
