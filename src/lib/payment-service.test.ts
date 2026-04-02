// Traceability: payment-recording
// REQ 1.2 -> it('createPayment only succeeds when tenant has active room (PROP 1)')
// REQ 1.3 -> it('creates payment with valid data and returns payment with id and timestamp')
// REQ 1.4 -> it('rejects when tenantId is missing'), it('rejects when amount is missing'), it('rejects when paymentDate is missing')
// REQ 1.5 -> it('rejects when amount is zero or negative (PROP 4)')
// REQ 1.6 -> it('creates payment with valid data and returns payment with id and timestamp')
// REQ 2.2, 2.4 -> it('listPayments returns payments with tenant names sorted by paymentDate desc (PROP 5, 6)')
// REQ 3.1, 3.4, 3.5 -> it('listTenantPayments returns payments and count sorted by date desc (PROP 7, 8, 9)')
// REQ 4.1, 4.2, 4.4, 4.5 -> it('create then getPayment returns same data (PROP 2)')
// PROP 1 -> it('createPayment only succeeds when tenant has active room (PROP 1)')
// PROP 2 -> it('create then getPayment returns same data (PROP 2)')
// PROP 3 -> it('rejects when tenantId is missing')
// PROP 4 -> it('rejects when amount is zero or negative (PROP 4)')
// PROP 5 -> it('listPayments returns payments with tenant names sorted by paymentDate desc (PROP 5, 6)')
// PROP 6 -> it('listPayments returns payments with tenant names sorted by paymentDate desc (PROP 5, 6)')
// PROP 10 -> it('createPayment sets createdAt in UTC (PROP 10)')
// REQ BC-7 -> it('FIFO: assigns to oldest unpaid cycle when no billingCycleYear/Month provided')
// REQ BC-8 -> it('explicit override: assigns to specified billingCycleYear/Month')
// REQ BC-9 -> it('creates billing cycle record via billingCycleRepo.findOrCreate')
// REQ BC-10 -> it('passes billingCycleId to paymentRepo.create')

import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import fc from "fast-check";
import { PaymentService } from "./payment-service";
import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { IBillingCycleRepository } from "@/domain/interfaces/billing-cycle-repository";
import type { BillingCycleBreakdown } from "@/domain/schemas/billing-cycle";
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

const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
  validateAccess: vi.fn().mockResolvedValue(role),
});

describe("PaymentService", () => {
  describe("createPayment", () => {
    describe("good cases", () => {
      it("creates payment with valid data and returns payment with id and timestamp", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
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
        const paymentRepo = createMockPaymentRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.createPayment(userId, propertyId, {
          tenantId,
          amount: 500000,
          paymentDate: "2024-06-15",
        });

        expect(result.id).toBe(created.id);
        expect(result.tenantId).toBe(tenantId);
        expect(result.amount).toBe(500000);
        expect(result.paymentDate).toEqual(new Date("2024-06-15"));
        expect(result.createdAt).toBeInstanceOf(Date);
        expect(paymentRepo.create).toHaveBeenCalledWith({
          tenantId,
          amount: 500000,
          paymentDate: new Date("2024-06-15"),
        });
      });

      it("create then getPayment returns same data (PROP 2)", async () => {
        const propertyId = crypto.randomUUID();
        const userId = crypto.randomUUID();
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
        amount: 999999.99,
        paymentDate: new Date("2024-07-01"),
        });
        const paymentRepo = createMockPaymentRepo({
          create: vi.fn().mockResolvedValue(created),
          findById: vi.fn().mockResolvedValue(created),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.createPayment(userId, propertyId, {
          tenantId,
          amount: 999999.99,
          paymentDate: "2024-07-01",
        });
        const retrieved = await service.getPayment(userId, propertyId, result.id);

        expect(retrieved).not.toBeNull();
        expect(retrieved!.id).toBe(result.id);
        expect(retrieved!.tenantId).toBe(result.tenantId);
        expect(retrieved!.amount).toBe(999999.99);
        expect(retrieved!.paymentDate).toEqual(result.paymentDate);
      });

      it("createPayment sets createdAt in UTC (PROP 10)", async () => {
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
          amount: 750000,
          paymentDate: new Date("2024-08-01"),
          createdAt: new Date(),
        });
        const paymentRepo = createMockPaymentRepo({
          create: vi.fn().mockResolvedValue(created),
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
          crypto.randomUUID(),
          propertyId,
          {
            tenantId,
            amount: 750000,
            paymentDate: "2024-08-01",
          }
        );

        expect(result.createdAt).toBeInstanceOf(Date);
        expect(result.createdAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
      });
    });

    describe("bad cases", () => {
      it("rejects when tenantId is missing (PROP 3)", async () => {
        const paymentRepo = createMockPaymentRepo();
        const tenantRepo = createMockTenantRepo();
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createPayment(crypto.randomUUID(), crypto.randomUUID(), {
            tenantId: "",
            amount: 500000,
            paymentDate: "2024-06-15",
          } as unknown as { tenantId: string; amount: number; paymentDate: string })
        ).rejects.toThrow(/tenant|invalid|required/i);
      });

      it("rejects when amount is missing", async () => {
        const paymentRepo = createMockPaymentRepo();
        const tenantRepo = createMockTenantRepo();
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createPayment(crypto.randomUUID(), crypto.randomUUID(), {
            tenantId: crypto.randomUUID(),
            amount: undefined as unknown as number,
            paymentDate: "2024-06-15",
          })
        ).rejects.toThrow();
      });

      it("rejects when paymentDate is missing", async () => {
        const paymentRepo = createMockPaymentRepo();
        const tenantRepo = createMockTenantRepo();
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createPayment(crypto.randomUUID(), crypto.randomUUID(), {
            tenantId: crypto.randomUUID(),
            amount: 500000,
            paymentDate: "",
          })
        ).rejects.toThrow(/date|required/i);
      });

      it("rejects when amount is zero or negative (PROP 4)", async () => {
        const paymentRepo = createMockPaymentRepo();
        const tenantRepo = createMockTenantRepo();
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createPayment(crypto.randomUUID(), crypto.randomUUID(), {
            tenantId: crypto.randomUUID(),
            amount: 0,
            paymentDate: "2024-06-15",
          })
        ).rejects.toThrow(/positive|amount/i);

        await expect(
          service.createPayment(crypto.randomUUID(), crypto.randomUUID(), {
            tenantId: crypto.randomUUID(),
            amount: -100,
            paymentDate: "2024-06-15",
          })
        ).rejects.toThrow(/positive|amount/i);
      });

      it("rejects when tenant not found", async () => {
        const tenantId = crypto.randomUUID();
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new PaymentService(
          createMockPaymentRepo(),
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createPayment(crypto.randomUUID(), "prop-1", {
            tenantId,
            amount: 500000,
            paymentDate: "2024-06-15",
          })
        ).rejects.toThrow(/Tenant not found/i);
      });

      it("rejects when tenant has no room assignment", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: tenantId,
          roomId: null,
          movedOutAt: null,
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          createMockPaymentRepo(),
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createPayment(crypto.randomUUID(), propertyId, {
            tenantId,
            amount: 500000,
            paymentDate: "2024-06-15",
          })
        ).rejects.toThrow(/no active room|no room assignment/i);
      });

      it("rejects when tenant has moved out", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({
          propertyId,
          id: tenantId,
          roomId: crypto.randomUUID(),
          movedOutAt: new Date(),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          createMockPaymentRepo(),
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createPayment(crypto.randomUUID(), propertyId, {
            tenantId,
            amount: 500000,
            paymentDate: "2024-06-15",
          })
        ).rejects.toThrow(/moved out/i);
      });
    });

    describe("edge cases", () => {
      it("createPayment only succeeds when tenant has active room (PROP 1)", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenantWithRoom = createTenant({
          propertyId,
          id: tenantId,
          roomId: crypto.randomUUID(),
          movedOutAt: null,
        });
        const created = createPayment({
          tenantId,
          tenantName: tenantWithRoom.name,
          amount: 1,
          paymentDate: new Date(),
        });
        const paymentRepo = createMockPaymentRepo({
          create: vi.fn().mockResolvedValue(created),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenantWithRoom),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.createPayment(
          crypto.randomUUID(),
          propertyId,
          {
            tenantId,
            amount: 1,
            paymentDate: new Date().toISOString().split("T")[0],
          }
        );

        expect(result.id).toBeDefined();
        expect(result.tenantId).toBe(tenantId);
        expect(result.amount).toBe(1);
      });

      it("rejects when payment date is in the future", async () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const paymentRepo = createMockPaymentRepo();
        const tenantRepo = createMockTenantRepo();
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.createPayment(crypto.randomUUID(), crypto.randomUUID(), {
            tenantId: crypto.randomUUID(),
            amount: 500000,
            paymentDate: tomorrow.toISOString().split("T")[0],
          })
        ).rejects.toThrow(/future|date/i);
      });

      it("rejects when user has no property access", async () => {
        const paymentRepo = createMockPaymentRepo();
        const tenantRepo = createMockTenantRepo();
        const propertyAccess = {
          validateAccess: vi.fn().mockRejectedValue(new Error("Forbidden")),
        };
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          propertyAccess
        );

        await expect(
          service.createPayment("user-1", "prop-1", {
            tenantId: crypto.randomUUID(),
            amount: 500000,
            paymentDate: "2024-06-15",
          })
        ).rejects.toThrow(/Forbidden/i);
      });
    });
  });

  describe("getPayment", () => {
    describe("good cases", () => {
      it("returns payment when found and tenant belongs to property", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const payment = createPayment({ tenantId });
        const tenant = createTenant({ propertyId, id: tenantId });
        const paymentRepo = createMockPaymentRepo({
          findById: vi.fn().mockResolvedValue(payment),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.getPayment(
          "user-1",
          propertyId,
          payment.id
        );

        expect(result).toEqual(payment);
      });
    });

    describe("bad cases", () => {
      it("returns null when payment not found", async () => {
        const paymentRepo = createMockPaymentRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new PaymentService(
          paymentRepo,
          createMockTenantRepo(),
          createMockPropertyAccess()
        );

        const result = await service.getPayment(
          "user-1",
          "prop-1",
          "non-existent"
        );

        expect(result).toBeNull();
      });

      it("returns null when payment tenant belongs to another property", async () => {
        const tenantId = crypto.randomUUID();
        const payment = createPayment({ tenantId });
        const tenant = createTenant({
          id: tenantId,
          propertyId: "other-property",
        });
        const paymentRepo = createMockPaymentRepo({
          findById: vi.fn().mockResolvedValue(payment),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.getPayment("user-1", "my-property", payment.id);

        expect(result).toBeNull();
      });
    });

    describe("edge cases", () => {
      it("returns payment when id matches and tenant belongs to property", async () => {
        const propertyId = crypto.randomUUID();
        const payment = createPayment({ id: "pay-1" });
        const tenant = createTenant({ propertyId, id: payment.tenantId });
        const paymentRepo = createMockPaymentRepo({
          findById: vi.fn().mockResolvedValue(payment),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.getPayment("user-1", propertyId, "pay-1");

        expect(result).not.toBeNull();
        expect(result!.id).toBe("pay-1");
      });
    });
  });

  describe("listPayments", () => {
    describe("good cases", () => {
      it("listPayments returns payments with tenant names sorted by paymentDate desc (PROP 5, 6)", async () => {
        const propertyId = crypto.randomUUID();
        const payments = [
          createPayment({
            tenantName: "Alice",
            amount: 500000,
            paymentDate: new Date("2024-06-01"),
            createdAt: new Date("2024-06-01"),
          }),
          createPayment({
            tenantName: "Bob",
            amount: 600000,
            paymentDate: new Date("2024-06-15"),
            createdAt: new Date("2024-06-15"),
          }),
        ].reverse();
        const paymentRepo = createMockPaymentRepo({
          findByProperty: vi.fn().mockResolvedValue(payments),
        });
        const service = new PaymentService(
          paymentRepo,
          createMockTenantRepo(),
          createMockPropertyAccess()
        );

        const result = await service.listPayments("user-1", propertyId);

        expect(result).toHaveLength(2);
        expect(result[0].tenantName).toBeDefined();
        expect(result[0].paymentDate >= result[1].paymentDate).toBe(true);
        expect(paymentRepo.findByProperty).toHaveBeenCalledWith(propertyId);
      });

      it("returns empty array when property has no payments", async () => {
        const paymentRepo = createMockPaymentRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new PaymentService(
          paymentRepo,
          createMockTenantRepo(),
          createMockPropertyAccess()
        );

        const result = await service.listPayments("user-1", "prop-1");

        expect(result).toEqual([]);
      });
    });

    describe("bad cases", () => {
      it("returns empty array when repository returns empty", async () => {
        const paymentRepo = createMockPaymentRepo({
          findByProperty: vi.fn().mockResolvedValue([]),
        });
        const service = new PaymentService(
          paymentRepo,
          createMockTenantRepo(),
          createMockPropertyAccess()
        );

        const result = await service.listPayments("user-1", "prop-1");

        expect(result).toHaveLength(0);
        expect(Array.isArray(result)).toBe(true);
      });
    });

    describe("edge cases", () => {
      it("returns all payments from repository for property", async () => {
        const propertyId = crypto.randomUUID();
        const one = createPayment({ id: "p1", amount: 100 });
        const paymentRepo = createMockPaymentRepo({
          findByProperty: vi.fn().mockResolvedValue([one]),
        });
        const service = new PaymentService(
          paymentRepo,
          createMockTenantRepo(),
          createMockPropertyAccess()
        );

        const result = await service.listPayments("user-1", propertyId);

        expect(result).toHaveLength(1);
        expect(result[0].id).toBe("p1");
        expect(result[0].amount).toBe(100);
      });
    });
  });

  describe("listTenantPayments", () => {
    describe("good cases", () => {
      it("listTenantPayments returns payments and count sorted by date desc (PROP 7, 8, 9)", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const payments = [
          createPayment({
            tenantId,
            amount: 500000,
            paymentDate: new Date("2024-05-01"),
          }),
          createPayment({
            tenantId,
            amount: 500000,
            paymentDate: new Date("2024-06-01"),
          }),
        ].reverse();
        const paymentRepo = createMockPaymentRepo({
          findByTenant: vi.fn().mockResolvedValue({
            payments,
            count: 2,
          }),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.listTenantPayments(
          "user-1",
          propertyId,
          tenantId
        );

        expect(result.payments).toHaveLength(2);
        expect(result.count).toBe(2);
        expect(result.payments[0].paymentDate >= result.payments[1].paymentDate).toBe(
          true
        );
        expect(result.payments[0]).toHaveProperty("amount");
        expect(result.payments[0]).toHaveProperty("paymentDate");
        expect(result.payments[0]).toHaveProperty("createdAt");
      });

      it("throws when tenant not found", async () => {
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new PaymentService(
          createMockPaymentRepo(),
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.listTenantPayments("user-1", "prop-1", "non-existent")
        ).rejects.toThrow(/Tenant not found/i);
      });
    });

    describe("bad cases", () => {
      it("rejects when tenant does not belong to property", async () => {
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(
            createTenant({ id: "t1", propertyId: "other-prop" })
          ),
        });
        const service = new PaymentService(
          createMockPaymentRepo(),
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.listTenantPayments("user-1", "my-prop", "t1")
        ).rejects.toThrow(/Tenant not found/i);
      });
    });

    describe("edge cases", () => {
      it("returns empty payments and count 0 for tenant with no payments", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const paymentRepo = createMockPaymentRepo({
          findByTenant: vi.fn().mockResolvedValue({ payments: [], count: 0 }),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        const result = await service.listTenantPayments(
          "user-1",
          propertyId,
          tenantId
        );

        expect(result.payments).toHaveLength(0);
        expect(result.count).toBe(0);
      });
    });

    describe("with pagination options", () => {
      it("passes no options to repo when none given (backward compat)", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const mockFindByTenant = vi.fn().mockResolvedValue({ payments: [], count: 0 });
        const paymentRepo = createMockPaymentRepo({ findByTenant: mockFindByTenant });
        const tenantRepo = createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) });
        const service = new PaymentService(paymentRepo, tenantRepo, createMockPropertyAccess());

        const result = await service.listTenantPayments("user-1", propertyId, tenantId);

        expect(mockFindByTenant).toHaveBeenCalledWith(tenantId, undefined);
        expect(result).not.toHaveProperty("totalPages");
      });

      it("forwards limit option to repo and returns totalPages", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const payments = Array.from({ length: 3 }, () => createPayment({ tenantId }));
        const mockFindByTenant = vi.fn().mockResolvedValue({ payments, count: 10, totalPages: 4 });
        const paymentRepo = createMockPaymentRepo({ findByTenant: mockFindByTenant });
        const tenantRepo = createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) });
        const service = new PaymentService(paymentRepo, tenantRepo, createMockPropertyAccess());

        const result = await service.listTenantPayments("user-1", propertyId, tenantId, { limit: 3 });

        expect(mockFindByTenant).toHaveBeenCalledWith(tenantId, { limit: 3 });
        expect(result.payments).toHaveLength(3);
        expect(result.count).toBe(10);
        expect(result.totalPages).toBe(4);
      });

      it("forwards limit + page options to repo", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const payments = Array.from({ length: 20 }, () => createPayment({ tenantId }));
        const mockFindByTenant = vi.fn().mockResolvedValue({ payments, count: 50, totalPages: 3 });
        const paymentRepo = createMockPaymentRepo({ findByTenant: mockFindByTenant });
        const tenantRepo = createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) });
        const service = new PaymentService(paymentRepo, tenantRepo, createMockPropertyAccess());

        const result = await service.listTenantPayments("user-1", propertyId, tenantId, { limit: 20, page: 2 });

        expect(mockFindByTenant).toHaveBeenCalledWith(tenantId, { limit: 20, page: 2 });
        expect(result.count).toBe(50);
        expect(result.totalPages).toBe(3);
      });

      it("returns empty list when page is beyond last page", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const mockFindByTenant = vi.fn().mockResolvedValue({ payments: [], count: 10, totalPages: 2 });
        const paymentRepo = createMockPaymentRepo({ findByTenant: mockFindByTenant });
        const tenantRepo = createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) });
        const service = new PaymentService(paymentRepo, tenantRepo, createMockPropertyAccess());

        const result = await service.listTenantPayments("user-1", propertyId, tenantId, { limit: 5, page: 99 });

        expect(result.payments).toHaveLength(0);
        expect(result.count).toBe(10);
        expect(result.totalPages).toBe(2);
      });

      it("returns totalPages=1 when limit exceeds total count", async () => {
        const propertyId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const tenant = createTenant({ propertyId, id: tenantId });
        const payments = Array.from({ length: 3 }, () => createPayment({ tenantId }));
        const mockFindByTenant = vi.fn().mockResolvedValue({ payments, count: 3, totalPages: 1 });
        const paymentRepo = createMockPaymentRepo({ findByTenant: mockFindByTenant });
        const tenantRepo = createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) });
        const service = new PaymentService(paymentRepo, tenantRepo, createMockPropertyAccess());

        const result = await service.listTenantPayments("user-1", propertyId, tenantId, { limit: 100 });

        expect(result.totalPages).toBe(1);
        expect(result.payments).toHaveLength(3);
      });
    });
  });

  describe("deletePayment", () => {
    describe("good cases", () => {
      it("deletePayment succeeds when payment exists and belongs to property", async () => {
        // Traceability: AC-API-1, AC-API-4
        const propertyId = crypto.randomUUID();
        const paymentId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const payment = createPayment({ id: paymentId, tenantId });
        const tenant = createTenant({ id: tenantId, propertyId });
        const mockDelete = vi.fn().mockResolvedValue(undefined);
        const paymentRepo = createMockPaymentRepo({
          findById: vi.fn().mockResolvedValue(payment),
          delete: mockDelete,
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.deletePayment("user-1", propertyId, paymentId)
        ).resolves.toBeUndefined();
        expect(mockDelete).toHaveBeenCalledWith(paymentId);
      });
    });

    describe("bad cases", () => {
      it("deletePayment throws when payment not found", async () => {
        // Traceability: AC-API-2
        const paymentRepo = createMockPaymentRepo({
          findById: vi.fn().mockResolvedValue(null),
        });
        const service = new PaymentService(
          paymentRepo,
          createMockTenantRepo(),
          createMockPropertyAccess()
        );

        await expect(
          service.deletePayment("user-1", "prop-1", "non-existent")
        ).rejects.toThrow(/not found/i);
      });

      it("deletePayment throws when payment belongs to another property", async () => {
        // Traceability: AC-API-4
        const paymentId = crypto.randomUUID();
        const tenantId = crypto.randomUUID();
        const payment = createPayment({ id: paymentId, tenantId });
        const tenantFromOtherProperty = createTenant({
          id: tenantId,
          propertyId: "other-property",
        });
        const paymentRepo = createMockPaymentRepo({
          findById: vi.fn().mockResolvedValue(payment),
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenantFromOtherProperty),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await expect(
          service.deletePayment("user-1", "my-property", paymentId)
        ).rejects.toThrow(/not found|forbidden/i);
      });
    });

    describe("edge cases", () => {
      it("deletePayment calls repository delete with the correct id", async () => {
        // Traceability: AC-API-1
        const propertyId = crypto.randomUUID();
        const paymentId = "exact-payment-id-123";
        const tenantId = crypto.randomUUID();
        const payment = createPayment({ id: paymentId, tenantId });
        const tenant = createTenant({ id: tenantId, propertyId });
        const mockDelete = vi.fn().mockResolvedValue(undefined);
        const paymentRepo = createMockPaymentRepo({
          findById: vi.fn().mockResolvedValue(payment),
          delete: mockDelete,
        });
        const tenantRepo = createMockTenantRepo({
          findById: vi.fn().mockResolvedValue(tenant),
        });
        const service = new PaymentService(
          paymentRepo,
          tenantRepo,
          createMockPropertyAccess()
        );

        await service.deletePayment("user-1", propertyId, paymentId);

        expect(mockDelete).toHaveBeenCalledTimes(1);
        expect(mockDelete).toHaveBeenCalledWith(paymentId);
      });
    });
  });

  describe("property-based tests", () => {
    // Feature: payment-recording, Property 2: Payment Creation Round Trip
    it("payment creation returns complete object with ID and timestamp", () => {
      return fc.assert(
        fc.asyncProperty(
          fc.uuid(),
          fc.double({ min: 0.01, max: 100000, noNaN: true }).map((n) => Math.round(n * 100) / 100),
          fc.date({ max: new Date(), noInvalidDate: true }),
          async (tenantId, amount, paymentDate) => {
            const propertyId = crypto.randomUUID();
            const tenant = createTenant({
              propertyId,
              id: tenantId,
              roomId: crypto.randomUUID(),
              movedOutAt: null,
            });
            const created = createPayment({
              tenantId,
              tenantName: tenant.name,
              amount,
              paymentDate,
            });
            const paymentRepo = createMockPaymentRepo({
              create: vi.fn().mockResolvedValue(created),
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
              crypto.randomUUID(),
              propertyId,
              {
                tenantId,
                amount,
                paymentDate: paymentDate.toISOString().split("T")[0],
              }
            );

            expect(result.id).toBeDefined();
            expect(result.createdAt).toBeInstanceOf(Date);
            expect(result.tenantId).toBe(tenantId);
            expect(result.amount).toBe(amount);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// =============================================================================
// createPayment — billing cycle assignment
// Traceability: billing-cycle-tracking
// =============================================================================
describe("createPayment - billing cycle assignment", () => {
  // Pin current date to April 2, 2026 so "current month" = year 2026, month 4
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-02T00:00:00.000Z"));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  // ── helpers ─────────────────────────────────────────────────────────────────

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
      findRecentByProperty: vi.fn(),
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

  function createMockBillingCycleRepo(
    overrides: Partial<IBillingCycleRepository> = {}
  ): IBillingCycleRepository {
    return {
      findOrCreate: vi.fn().mockResolvedValue({
        id: "generated-cycle-id",
        tenantId: "t1",
        year: 2026,
        month: 2,
        createdAt: new Date(),
      }),
      findWithPaymentSums: vi.fn().mockResolvedValue([]),
      ...overrides,
    };
  }

  function createMockCycleBreakdownProvider(
    breakdown: BillingCycleBreakdown = {
      tenantId: "t1",
      unpaidCycles: [
        {
          year: 2026,
          month: 2,
          cycleId: null,
          totalPaid: 0,
          monthlyRent: 1_500_000,
          status: "unpaid",
          amountOwed: 1_500_000,
        },
      ],
      allPaid: false,
    }
  ) {
    return {
      calculateCycleBreakdown: vi.fn().mockResolvedValue(breakdown),
    };
  }

  const createMockPropertyAccess = (role: "owner" | "staff" = "owner") => ({
    validateAccess: vi.fn().mockResolvedValue(role),
  });

  /** Build a PaymentService wired for cycle-assignment tests. */
  function makeService({
    paymentRepo = createMockPaymentRepo(),
    tenantRepo = createMockTenantRepo(),
    propertyAccess = createMockPropertyAccess(),
    billingCycleRepo = createMockBillingCycleRepo(),
    cycleBreakdownProvider = createMockCycleBreakdownProvider(),
  }: {
    paymentRepo?: IPaymentRepository;
    tenantRepo?: ITenantRepository;
    propertyAccess?: { validateAccess: ReturnType<typeof vi.fn> };
    billingCycleRepo?: IBillingCycleRepository;
    cycleBreakdownProvider?: { calculateCycleBreakdown: ReturnType<typeof vi.fn> };
  } = {}) {
    return new PaymentService(
      paymentRepo,
      tenantRepo,
      propertyAccess,
      billingCycleRepo,
      cycleBreakdownProvider
    );
  }

  describe("good cases", () => {
    it("FIFO default: assigns to oldest unpaid cycle when no billingCycleYear/Month given", async () => {
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
        amount: 500_000,
        paymentDate: new Date("2026-04-01"),
        billingCycleId: "generated-cycle-id",
      });
      const billingCycleRepo = createMockBillingCycleRepo({
        findOrCreate: vi.fn().mockResolvedValue({
          id: "generated-cycle-id",
          tenantId,
          year: 2026,
          month: 2,
          createdAt: new Date(),
        }),
      });
      const cycleBreakdownProvider = createMockCycleBreakdownProvider({
        tenantId,
        unpaidCycles: [
          {
            year: 2026,
            month: 2,
            cycleId: null,
            totalPaid: 0,
            monthlyRent: 1_500_000,
            status: "unpaid",
            amountOwed: 1_500_000,
          },
          {
            year: 2026,
            month: 3,
            cycleId: null,
            totalPaid: 0,
            monthlyRent: 1_500_000,
            status: "unpaid",
            amountOwed: 1_500_000,
          },
        ],
        allPaid: false,
      });
      const paymentRepo = createMockPaymentRepo({
        create: vi.fn().mockResolvedValue(created),
      });
      const service = makeService({
        paymentRepo,
        tenantRepo: createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) }),
        billingCycleRepo,
        cycleBreakdownProvider,
      });

      await service.createPayment(crypto.randomUUID(), propertyId, {
        tenantId,
        amount: 500_000,
        paymentDate: "2026-04-01",
        // no billingCycleYear / billingCycleMonth
      });

      // Must have called findOrCreate with the OLDEST unpaid cycle (Feb 2026)
      expect(billingCycleRepo.findOrCreate).toHaveBeenCalledWith(tenantId, 2026, 2);
    });

    it("explicit override: assigns to specified billingCycleYear/Month", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: null,
      });
      const created = createPayment({ tenantId, billingCycleId: "override-cycle-id" });
      const billingCycleRepo = createMockBillingCycleRepo({
        findOrCreate: vi.fn().mockResolvedValue({
          id: "override-cycle-id",
          tenantId,
          year: 2026,
          month: 3,
          createdAt: new Date(),
        }),
      });
      const cycleBreakdownProvider = createMockCycleBreakdownProvider();
      const paymentRepo = createMockPaymentRepo({
        create: vi.fn().mockResolvedValue(created),
      });
      const service = makeService({
        paymentRepo,
        tenantRepo: createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) }),
        billingCycleRepo,
        cycleBreakdownProvider,
      });

      await service.createPayment(crypto.randomUUID(), propertyId, {
        tenantId,
        amount: 1_000_000,
        paymentDate: "2026-04-01",
        billingCycleYear: 2026,
        billingCycleMonth: 3, // explicit override → March
      });

      // Must use the explicitly provided year/month — NOT call calculateCycleBreakdown
      expect(billingCycleRepo.findOrCreate).toHaveBeenCalledWith(tenantId, 2026, 3);
      expect(cycleBreakdownProvider.calculateCycleBreakdown).not.toHaveBeenCalled();
    });

    it("creates billing cycle record via billingCycleRepo.findOrCreate", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: null,
      });
      const cycleId = "my-cycle-id";
      const billingCycleRepo = createMockBillingCycleRepo({
        findOrCreate: vi.fn().mockResolvedValue({
          id: cycleId,
          tenantId,
          year: 2026,
          month: 4,
          createdAt: new Date(),
        }),
      });
      const paymentRepo = createMockPaymentRepo({
        create: vi.fn().mockResolvedValue(
          createPayment({ tenantId, billingCycleId: cycleId })
        ),
      });
      const service = makeService({
        paymentRepo,
        tenantRepo: createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) }),
        billingCycleRepo,
        cycleBreakdownProvider: createMockCycleBreakdownProvider({
          tenantId,
          unpaidCycles: [
            { year: 2026, month: 4, cycleId: null, totalPaid: 0, monthlyRent: 1_000_000, status: "unpaid", amountOwed: 1_000_000 },
          ],
          allPaid: false,
        }),
      });

      await service.createPayment(crypto.randomUUID(), propertyId, {
        tenantId,
        amount: 500_000,
        paymentDate: "2026-04-01",
      });

      expect(billingCycleRepo.findOrCreate).toHaveBeenCalledTimes(1);
    });

    it("passes billingCycleId to paymentRepo.create", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: null,
      });
      const cycleId = "cycle-id-for-payment";
      const billingCycleRepo = createMockBillingCycleRepo({
        findOrCreate: vi.fn().mockResolvedValue({
          id: cycleId,
          tenantId,
          year: 2026,
          month: 2,
          createdAt: new Date(),
        }),
      });
      const mockCreate = vi.fn().mockResolvedValue(
        createPayment({ tenantId, billingCycleId: cycleId })
      );
      const paymentRepo = createMockPaymentRepo({ create: mockCreate });
      const service = makeService({
        paymentRepo,
        tenantRepo: createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) }),
        billingCycleRepo,
        cycleBreakdownProvider: createMockCycleBreakdownProvider({
          tenantId,
          unpaidCycles: [
            { year: 2026, month: 2, cycleId: null, totalPaid: 0, monthlyRent: 1_000_000, status: "unpaid", amountOwed: 1_000_000 },
          ],
          allPaid: false,
        }),
      });

      await service.createPayment(crypto.randomUUID(), propertyId, {
        tenantId,
        amount: 300_000,
        paymentDate: "2026-04-01",
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ billingCycleId: cycleId })
      );
    });
  });

  describe("bad cases", () => {
    it("all cycles paid with no explicit override → assigns to current month (April 2026) as fallback", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: null,
      });
      const billingCycleRepo = createMockBillingCycleRepo({
        findOrCreate: vi.fn().mockResolvedValue({
          id: "fallback-cycle-id",
          tenantId,
          year: 2026,
          month: 4,
          createdAt: new Date(),
        }),
      });
      // calculateCycleBreakdown says allPaid: true — no unpaid cycles
      const cycleBreakdownProvider = createMockCycleBreakdownProvider({
        tenantId,
        unpaidCycles: [],
        allPaid: true,
      });
      const paymentRepo = createMockPaymentRepo({
        create: vi.fn().mockResolvedValue(
          createPayment({ tenantId, billingCycleId: "fallback-cycle-id" })
        ),
      });
      const service = makeService({
        paymentRepo,
        tenantRepo: createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) }),
        billingCycleRepo,
        cycleBreakdownProvider,
      });

      await service.createPayment(crypto.randomUUID(), propertyId, {
        tenantId,
        amount: 500_000,
        paymentDate: "2026-04-01",
        // no billingCycleYear/Month — FIFO but all paid → fallback to current month
      });

      // Fallback: current month = April 2026
      expect(billingCycleRepo.findOrCreate).toHaveBeenCalledWith(tenantId, 2026, 4);
    });
  });

  describe("edge cases", () => {
    it("first ever payment for tenant (no prior cycles) → assigns to first unpaid cycle from breakdown", async () => {
      const propertyId = crypto.randomUUID();
      const tenantId = crypto.randomUUID();
      const tenant = createTenant({
        propertyId,
        id: tenantId,
        roomId: crypto.randomUUID(),
        movedOutAt: null,
      });
      const billingCycleRepo = createMockBillingCycleRepo({
        findOrCreate: vi.fn().mockResolvedValue({
          id: "first-cycle-id",
          tenantId,
          year: 2026,
          month: 4,
          createdAt: new Date(),
        }),
      });
      // No prior cycles: calculateCycleBreakdown returns current month as sole unpaid
      const cycleBreakdownProvider = createMockCycleBreakdownProvider({
        tenantId,
        unpaidCycles: [
          {
            year: 2026,
            month: 4,
            cycleId: null,
            totalPaid: 0,
            monthlyRent: 1_000_000,
            status: "unpaid",
            amountOwed: 1_000_000,
          },
        ],
        allPaid: false,
      });
      const paymentRepo = createMockPaymentRepo({
        create: vi.fn().mockResolvedValue(
          createPayment({ tenantId, billingCycleId: "first-cycle-id" })
        ),
      });
      const service = makeService({
        paymentRepo,
        tenantRepo: createMockTenantRepo({ findById: vi.fn().mockResolvedValue(tenant) }),
        billingCycleRepo,
        cycleBreakdownProvider,
      });

      const result = await service.createPayment(crypto.randomUUID(), propertyId, {
        tenantId,
        amount: 1_000_000,
        paymentDate: "2026-04-01",
      });

      expect(billingCycleRepo.findOrCreate).toHaveBeenCalledWith(tenantId, 2026, 4);
      expect(result.billingCycleId).toBe("first-cycle-id");
    });
  });
});
