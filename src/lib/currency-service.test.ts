// Traceability: settings-currency-management
// AC-1 -> it('list returns all currencies')
// AC-1 -> it('add creates a new currency with valid input')
// AC-1 -> it('remove deletes a currency with no active users')
// AC-5 -> it('remove throws CurrencyInUseError when currency is selected by a user')
// AC-5 -> it('remove throws LastCurrencyError when it is the only currency')
// AC-1 -> it('remove throws CurrencyNotFoundError when id does not exist')
// AC-1 -> it('add throws CurrencyExistsError when code already exists')
// PROP 1 -> it('property-based: add normalizes code to uppercase')

import { describe, it, expect, vi } from "vitest";
import fc from "fast-check";
import {
  CurrencyService,
  CurrencyExistsError,
  CurrencyInUseError,
  LastCurrencyError,
  CurrencyNotFoundError,
} from "./currency-service";
import type { ICurrencyRepository } from "@/domain/interfaces/currency-repository";
import { createCurrency } from "@/test/fixtures/currency";

function createMockRepo(overrides: Partial<ICurrencyRepository> = {}): ICurrencyRepository {
  return {
    list: vi.fn(),
    create: vi.fn(),
    findByCode: vi.fn(),
    delete: vi.fn(),
    findById: vi.fn(),
    ...overrides,
  };
}

describe("CurrencyService.list", () => {
  describe("good cases", () => {
    it("returns all currencies", async () => {
      const currencies = [createCurrency({ code: "EUR" }), createCurrency({ code: "IDR", locale: "id-ID", label: "Indonesian Rupiah" })];
      const repo = createMockRepo({ list: vi.fn().mockResolvedValue(currencies) });
      const service = new CurrencyService(repo);

      const result = await service.list();

      expect(result).toEqual(currencies);
      expect(repo.list).toHaveBeenCalledOnce();
    });
  });

  describe("bad cases", () => {
    it("throws when repository throws", async () => {
      const repo = createMockRepo({ list: vi.fn().mockRejectedValue(new Error("DB error")) });
      const service = new CurrencyService(repo);

      await expect(service.list()).rejects.toThrow("DB error");
    });
  });

  describe("edge cases", () => {
    it("returns empty array when no currencies exist", async () => {
      const repo = createMockRepo({ list: vi.fn().mockResolvedValue([]) });
      const service = new CurrencyService(repo);

      const result = await service.list();

      expect(result).toEqual([]);
    });
  });
});

describe("CurrencyService.add", () => {
  describe("good cases", () => {
    it("creates a new currency with valid input", async () => {
      const created = createCurrency({ code: "USD", locale: "en-US", label: "US Dollar" });
      const repo = createMockRepo({
        findByCode: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
      });
      const service = new CurrencyService(repo);

      const result = await service.add({ code: "USD", locale: "en-US", label: "US Dollar" });

      expect(result).toEqual(created);
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: "USD", locale: "en-US", label: "US Dollar" })
      );
    });

    it("returns the created currency with all fields populated", async () => {
      const created = createCurrency({ code: "SGD", locale: "en-SG", label: "Singapore Dollar" });
      const repo = createMockRepo({
        findByCode: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
      });
      const service = new CurrencyService(repo);

      const result = await service.add({ code: "SGD", locale: "en-SG", label: "Singapore Dollar" });

      expect(result.id).toBeDefined();
      expect(result.code).toBe("SGD");
      expect(result.locale).toBe("en-SG");
      expect(result.label).toBe("Singapore Dollar");
      expect(result.createdAt).toBeInstanceOf(Date);
    });
  });

  describe("bad cases", () => {
    it("throws CurrencyExistsError when code already exists", async () => {
      const existing = createCurrency({ code: "EUR" });
      const repo = createMockRepo({
        findByCode: vi.fn().mockResolvedValue(existing),
      });
      const service = new CurrencyService(repo);

      await expect(service.add({ code: "EUR", locale: "en-IE", label: "Euro" })).rejects.toThrow(CurrencyExistsError);
      expect(repo.create).not.toHaveBeenCalled();
    });

    it("does not call create when duplicate code is detected", async () => {
      const existing = createCurrency({ code: "IDR" });
      const repo = createMockRepo({
        findByCode: vi.fn().mockResolvedValue(existing),
        create: vi.fn(),
      });
      const service = new CurrencyService(repo);

      await expect(service.add({ code: "IDR", locale: "id-ID", label: "Indonesian Rupiah" })).rejects.toThrow(CurrencyExistsError);
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("normalizes code to uppercase before checking and storing", async () => {
      const created = createCurrency({ code: "USD" });
      const repo = createMockRepo({
        findByCode: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(created),
      });
      const service = new CurrencyService(repo);

      await service.add({ code: "usd", locale: "en-US", label: "US Dollar" });

      expect(repo.findByCode).toHaveBeenCalledWith("USD");
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: "USD" })
      );
    });

    // Feature: settings-currency-management, PROP 1: code is always stored uppercase
    it("property-based: code is always normalized to uppercase regardless of input casing", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.stringMatching(/^[a-zA-Z]{3}$/),
          async (rawCode) => {
            const created = createCurrency({ code: rawCode.toUpperCase() });
            const repo = createMockRepo({
              findByCode: vi.fn().mockResolvedValue(null),
              create: vi.fn().mockResolvedValue(created),
            });
            const service = new CurrencyService(repo);

            await service.add({ code: rawCode, locale: "en-US", label: "Test" });

            expect(repo.create).toHaveBeenCalledWith(
              expect.objectContaining({ code: rawCode.toUpperCase() })
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

describe("CurrencyService.remove", () => {
  describe("good cases", () => {
    it("deletes a currency when no users have it selected", async () => {
      const currency = createCurrency({ code: "USD" });
      const repo = createMockRepo({
        list: vi.fn().mockResolvedValue([createCurrency({ code: "EUR" }), currency]),
        findById: vi.fn().mockResolvedValue(currency),
        delete: vi.fn().mockResolvedValue(undefined),
      });
      const service = new CurrencyService(repo);
      const getUserCount = vi.fn().mockResolvedValue(0);

      await service.remove(currency.id, getUserCount);

      expect(repo.delete).toHaveBeenCalledWith(currency.id);
      expect(getUserCount).toHaveBeenCalledWith(currency.code);
    });
  });

  describe("bad cases", () => {
    it("throws CurrencyInUseError when at least one user has this currency selected", async () => {
      const currency = createCurrency({ code: "IDR" });
      const repo = createMockRepo({
        list: vi.fn().mockResolvedValue([createCurrency({ code: "EUR" }), currency]),
        findById: vi.fn().mockResolvedValue(currency),
        delete: vi.fn(),
      });
      const service = new CurrencyService(repo);
      const getUserCount = vi.fn().mockResolvedValue(3);

      await expect(service.remove(currency.id, getUserCount)).rejects.toThrow(CurrencyInUseError);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("throws LastCurrencyError when it is the only currency in the system", async () => {
      const currency = createCurrency({ code: "EUR" });
      const repo = createMockRepo({
        list: vi.fn().mockResolvedValue([currency]),
        findById: vi.fn().mockResolvedValue(currency),
        delete: vi.fn(),
      });
      const service = new CurrencyService(repo);
      const getUserCount = vi.fn().mockResolvedValue(0);

      await expect(service.remove(currency.id, getUserCount)).rejects.toThrow(LastCurrencyError);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("throws CurrencyNotFoundError when id does not exist", async () => {
      const repo = createMockRepo({
        findById: vi.fn().mockResolvedValue(null),
        delete: vi.fn(),
      });
      const service = new CurrencyService(repo);
      const getUserCount = vi.fn().mockResolvedValue(0);

      await expect(service.remove("nonexistent-id", getUserCount)).rejects.toThrow(CurrencyNotFoundError);
      expect(repo.delete).not.toHaveBeenCalled();
      expect(getUserCount).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("checks user count before checking last-currency constraint", async () => {
      const currency = createCurrency({ code: "EUR" });
      const repo = createMockRepo({
        list: vi.fn().mockResolvedValue([currency]),
        findById: vi.fn().mockResolvedValue(currency),
        delete: vi.fn(),
      });
      const service = new CurrencyService(repo);
      // 1 user AND last currency — should throw CurrencyInUseError (user check wins)
      const getUserCount = vi.fn().mockResolvedValue(1);

      await expect(service.remove(currency.id, getUserCount)).rejects.toThrow(CurrencyInUseError);
      expect(repo.delete).not.toHaveBeenCalled();
    });

    it("does not call getUserCount when currency is not found", async () => {
      const repo = createMockRepo({
        findById: vi.fn().mockResolvedValue(null),
      });
      const service = new CurrencyService(repo);
      const getUserCount = vi.fn();

      await expect(service.remove("bad-id", getUserCount)).rejects.toThrow(CurrencyNotFoundError);
      expect(getUserCount).not.toHaveBeenCalled();
    });
  });
});
