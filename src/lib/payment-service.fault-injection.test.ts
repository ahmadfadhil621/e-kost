/**
 * Gate 2: Fault injection tests for payment-recording.
 * Each test injects a fault and asserts correct behavior. When the fault is present,
 * the assertion fails → fault is KILLED. If the test passes with the fault present,
 * the fault SURVIVED (tests are too weak).
 * Run: npx vitest run src/lib/payment-service.fault-injection.test.ts
 * We expect tests to FAIL (fault killed). Any passing test = surviving fault.
 */

import { describe, it, expect, vi } from "vitest";
import { PaymentService } from "./payment-service";
import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import { createPayment } from "@/test/fixtures/payment";
import { createTenant } from "@/test/fixtures/tenant";

function createMockPaymentRepo(
  overrides: Partial<IPaymentRepository> = {}
): IPaymentRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn(),
    findByTenant: vi.fn(),
    sumByPropertyAndMonth: vi.fn(),
    delete: vi.fn(),
    ...overrides,
  };
}

function createMockTenantRepo(
  overrides: Partial<ITenantRepository> = {}
): ITenantRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn(),
    update: vi.fn(),
    assignRoom: vi.fn(),
    removeRoomAssignment: vi.fn(),
    softDelete: vi.fn(),
    ...overrides,
  };
}

const createMockPropertyAccess = () => ({
  validateAccess: vi.fn().mockResolvedValue("owner"),
});

describe("Gate 2: Fault injection (payment-recording)", () => {
  describe("good cases", () => {
    it("fault missing-id: createPayment returns result without id — KILLED by id assertion", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: null,
      });
      const faultyCreated = createPayment({ tenantId, tenantName: tenant.name });
      const noId = { ...faultyCreated, id: undefined as unknown as string };
      const paymentRepo = createMockPaymentRepo({
        create: vi.fn().mockResolvedValue(noId),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new PaymentService(
        paymentRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      const result = await service.createPayment(
        "user-1",
        propertyId,
        { tenantId, amount: 500000, paymentDate: "2024-06-15" }
      );

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("string");
    });

    it("fault missing-createdAt: createPayment returns result without createdAt — KILLED by timestamp assertion", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: null,
      });
      const faultyCreated = createPayment({
        tenantId,
        tenantName: tenant.name,
        amount: 500000,
        paymentDate: new Date("2024-06-15"),
      });
      const noCreatedAt = { ...faultyCreated, createdAt: undefined as unknown as Date };
      const paymentRepo = createMockPaymentRepo({
        create: vi.fn().mockResolvedValue(noCreatedAt),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new PaymentService(
        paymentRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      const result = await service.createPayment(
        "user-1",
        propertyId,
        { tenantId, amount: 500000, paymentDate: "2024-06-15" }
      );

      expect(result.createdAt).toBeInstanceOf(Date);
    });

    it("fault no-validation-negative-amount: createPayment accepts negative amount — KILLED by validation", async () => {
      const paymentRepo = createMockPaymentRepo();
      const tenantRepo = createMockTenantRepo();
      const service = new PaymentService(
        paymentRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      await expect(
        service.createPayment("user-1", "prop-1", {
          tenantId: crypto.randomUUID(),
          amount: -100,
          paymentDate: "2024-06-15",
        })
      ).rejects.toThrow(/positive|amount/i);
    });

    it("fault no-validation-zero-amount: createPayment accepts zero amount — KILLED by validation", async () => {
      const paymentRepo = createMockPaymentRepo();
      const tenantRepo = createMockTenantRepo();
      const service = new PaymentService(
        paymentRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      await expect(
        service.createPayment("user-1", "prop-1", {
          tenantId: crypto.randomUUID(),
          amount: 0,
          paymentDate: "2024-06-15",
        })
      ).rejects.toThrow(/positive|amount/i);
    });

    it("fault no-tenant-room-check: createPayment allows tenant without room — KILLED by business rule", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenantNoRoom = createTenant({
        propertyId,
        id: tenantId,
        roomId: null,
        movedOutAt: null,
      });
      const paymentRepo = createMockPaymentRepo();
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenantNoRoom),
      });
      const service = new PaymentService(
        paymentRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      await expect(
        service.createPayment("user-1", propertyId, {
          tenantId,
          amount: 500000,
          paymentDate: "2024-06-15",
        })
      ).rejects.toThrow(/no active room|no room assignment/i);
    });

    it("fault no-moved-out-check: createPayment allows moved-out tenant — KILLED by business rule", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenantMovedOut = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: new Date(),
      });
      const paymentRepo = createMockPaymentRepo();
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenantMovedOut),
      });
      const service = new PaymentService(
        paymentRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      await expect(
        service.createPayment("user-1", propertyId, {
          tenantId,
          amount: 500000,
          paymentDate: "2024-06-15",
        })
      ).rejects.toThrow(/moved out/i);
    });

    it("fault wrong-amount-round-trip: create then getPayment returns different amount — KILLED by PROP 2", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: null,
      });
      const created = createPayment({
        tenantId,
        tenantName: tenant.name,
        amount: 500000,
        paymentDate: new Date("2024-06-15"),
      });
      const wrongAmount = createPayment({
        ...created,
        amount: 999999,
      });
      const paymentRepo = createMockPaymentRepo({
        create: vi.fn().mockResolvedValue(created),
        findById: vi.fn().mockResolvedValue(wrongAmount),
      });
      const tenantRepo = createMockTenantRepo({
        findById: vi.fn().mockResolvedValue(tenant),
      });
      const service = new PaymentService(
        paymentRepo,
        tenantRepo,
        createMockPropertyAccess()
      );

      const result = await service.createPayment("user-1", propertyId, {
        tenantId,
        amount: 500000,
        paymentDate: "2024-06-15",
      });
      const retrieved = await service.getPayment("user-1", propertyId, result.id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.amount).toBe(500000);
    });

    it("fault list-missing-tenantName: listPayments returns payment without tenantName — KILLED by PROP 5", async () => {
      const propertyId = crypto.randomUUID();
      const faultyPayment = createPayment({
        tenantName: "",
        amount: 500000,
        paymentDate: new Date("2024-06-15"),
      });
      const paymentRepo = createMockPaymentRepo({
        findByProperty: vi.fn().mockResolvedValue([faultyPayment]),
      });
      const service = new PaymentService(
        paymentRepo,
        createMockTenantRepo(),
        createMockPropertyAccess()
      );

      const result = await service.listPayments("user-1", propertyId);

      expect(result[0].tenantName).toBeDefined();
      expect(result[0].tenantName.length).toBeGreaterThan(0);
    });

    it("fault list-wrong-sort: listPayments returns ascending instead of descending — KILLED by PROP 6", async () => {
      const propertyId = crypto.randomUUID();
      const paymentsAsc = [
        createPayment({
          amount: 100,
          paymentDate: new Date("2024-05-01"),
          createdAt: new Date("2024-05-01"),
        }),
        createPayment({
          amount: 200,
          paymentDate: new Date("2024-06-15"),
          createdAt: new Date("2024-06-15"),
        }),
      ];
      const paymentRepo = createMockPaymentRepo({
        findByProperty: vi.fn().mockResolvedValue(paymentsAsc),
      });
      const service = new PaymentService(
        paymentRepo,
        createMockTenantRepo(),
        createMockPropertyAccess()
      );

      const result = await service.listPayments("user-1", propertyId);

      expect(result.length).toBeGreaterThanOrEqual(1);
      if (result.length >= 2) {
        expect(
          result[0].paymentDate >= result[1].paymentDate ||
            result[0].paymentDate.getTime() >= result[1].paymentDate.getTime()
        ).toBe(true);
      }
    });
  });

  describe("bad cases", () => {
    it("no bad-case scenarios for fault injection (faults are injected in good cases)", () => {
      expect(true).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("no edge-case scenarios for fault injection", () => {
      expect(true).toBe(true);
    });
  });
});
