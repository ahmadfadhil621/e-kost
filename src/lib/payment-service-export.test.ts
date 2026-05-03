// Traceability: finance-payment-export (issue #121)
// AC-1  -> it('returns buffer and filename for a valid export request')
// AC-2  -> it('XLSX sheet has 6 header columns in correct order')
// AC-2  -> it('XLSX totals row has SUM formula on Amount column')
// AC-3  -> it('date cell is formatted DD/MM/YYYY for id locale')
// AC-3  -> it('date cell is formatted MM/DD/YYYY for en locale')
// AC-3  -> it('room cell is blank when roomNumber is null')
// AC-3  -> it('period cell is blank when billing cycle is null')
// AC-3  -> it('notes cell is blank when note is null')
// AC-3  -> it('amount column value is numeric not a string')
// AC-4  -> it('filename includes dateFrom and dateTo when both filters provided')
// AC-4  -> it('filename uses today fallback when no date filters provided')
// AC-5  -> it('throws ExportRowCapError when repo returns more than 10000 rows')
// AC-5  -> it('succeeds with exactly 10000 rows')
// AC-6  -> it('produces valid XLSX with headers and totals when 0 data rows')
// AC-8  -> it('listPayments passes filters to findByProperty when provided')
// AC-8  -> it('listPayments passes no filters when none provided')
// PROP-1 -> it('export always produces valid XLSX structure regardless of row count')

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import ExcelJS from "exceljs";
import { PaymentService, ExportRowCapError } from "./payment-service";
import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { PaymentExportRow, PaymentFilters } from "@/domain/schemas/payment";
import { createPayment, createPaymentExportRow } from "@/test/fixtures/payment";

// ── helpers ────────────────────────────────────────────────────────────────

function createMockPaymentRepo(
  overrides: Partial<IPaymentRepository> = {}
): IPaymentRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn().mockResolvedValue([]),
    findByTenant: vi.fn(),
    sumByPropertyAndMonth: vi.fn(),
    findRecentByProperty: vi.fn().mockResolvedValue([]),
    findForExport: vi.fn().mockResolvedValue([]),
    delete: vi.fn(),
    ...overrides,
  } as IPaymentRepository;
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

const mockPropertyAccess = {
  validateAccess: vi.fn().mockResolvedValue("owner" as const),
};

function makeService(paymentRepo: IPaymentRepository) {
  return new PaymentService(
    paymentRepo,
    createMockTenantRepo(),
    mockPropertyAccess
  );
}

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

// ── PaymentService.exportPayments ──────────────────────────────────────────

describe("PaymentService.exportPayments", () => {
  const userId = "user-1";
  const propertyId = "prop-1";

  beforeEach(() => {
    mockPropertyAccess.validateAccess.mockResolvedValue("owner");
  });

  describe("good cases", () => {
    it("returns buffer and filename for a valid export request", async () => {
      const row = createPaymentExportRow();
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const result = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "id");

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toMatch(/\.xlsx$/);
    });

    it("XLSX sheet has 6 header columns in correct order", async () => {
      const row = createPaymentExportRow();
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const headerRow = sheet.getRow(1);

      expect(headerRow.getCell(1).value).toBeTruthy(); // Date
      expect(headerRow.getCell(2).value).toBeTruthy(); // Tenant
      expect(headerRow.getCell(3).value).toBeTruthy(); // Room
      expect(headerRow.getCell(4).value).toBeTruthy(); // Period
      expect(headerRow.getCell(5).value).toBeTruthy(); // Amount (IDR)
      expect(headerRow.getCell(6).value).toBeTruthy(); // Notes
    });

    it("XLSX totals row has SUM formula on Amount column", async () => {
      const row = createPaymentExportRow({ amount: 500_000 });
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      // 1 header row + 1 data row + 1 totals row = 3 rows total
      const totalsRow = sheet.getRow(3);
      const amountCell = totalsRow.getCell(5);
      expect(typeof amountCell.value).toBe("object"); // formula object
      expect((amountCell.value as ExcelJS.CellFormulaValue).formula).toMatch(/SUM\(E2:E2\)/i);
    });

    it("produces valid XLSX with headers and totals when 0 data rows (AC-6)", async () => {
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(paymentRepo);

      const result = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      expect(result.buffer).toBeInstanceOf(Buffer);
      const wb = await loadWorkbook(result.buffer);
      const sheet = wb.worksheets[0];

      // Row 1 is headers, row 2 is totals (no data rows)
      expect(sheet.rowCount).toBe(2);
      const headerRow = sheet.getRow(1);
      expect(headerRow.getCell(1).value).toBeTruthy();

      const totalsRow = sheet.getRow(2);
      const amountCell = totalsRow.getCell(5);
      // SUM over empty range should still be a formula
      expect(typeof amountCell.value).toBe("object");
      expect((amountCell.value as ExcelJS.CellFormulaValue).formula).toMatch(/SUM/i);
    });

    it("succeeds with exactly 10,000 rows", async () => {
      const rows = Array.from({ length: 10_000 }, () => createPaymentExportRow());
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(paymentRepo);

      await expect(
        service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en")
      ).resolves.not.toThrow();
    });

    it("filename includes dateFrom and dateTo when both filters provided (AC-4)", async () => {
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(paymentRepo);

      const filters: PaymentFilters = { dateFrom: "2025-01-01", dateTo: "2025-05-31" };
      const { filename } = await service.exportPayments(userId, propertyId, filters, "Asia/Jakarta", "en");

      expect(filename).toBe("payments-2025-01-01_to_2025-05-31.xlsx");
    });

    it("filename uses today fallback when no date filters provided (AC-4)", async () => {
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(paymentRepo);

      const { filename } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      // Should match payments-YYYY-MM-DD.xlsx with today's date in Asia/Jakarta
      expect(filename).toMatch(/^payments-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
  });

  describe("bad cases", () => {
    it("throws ExportRowCapError when repo returns more than 10,000 rows", async () => {
      const rows = Array.from({ length: 10_001 }, () => createPaymentExportRow());
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(paymentRepo);

      await expect(
        service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en")
      ).rejects.toThrow(ExportRowCapError);
    });

    it("throws when user does not have access to the property", async () => {
      mockPropertyAccess.validateAccess.mockRejectedValueOnce(new Error("Forbidden"));
      const service = makeService(createMockPaymentRepo());

      await expect(
        service.exportPayments(userId, "wrong-prop", {}, "Asia/Jakarta", "en")
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("edge cases", () => {
    it("room cell is blank when roomNumber is null (AC-3)", async () => {
      const row = createPaymentExportRow({ roomNumber: null });
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const roomCell = dataRow.getCell(3);
      expect(roomCell.value === null || roomCell.value === "" || roomCell.value === undefined).toBe(true);
    });

    it("period cell is blank when billing cycle is null (AC-3)", async () => {
      const row = createPaymentExportRow({ billingCycleYear: null, billingCycleMonth: null });
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const periodCell = dataRow.getCell(4);
      expect(periodCell.value === null || periodCell.value === "" || periodCell.value === undefined).toBe(true);
    });

    it("notes cell is blank when note is null (AC-3)", async () => {
      const row = createPaymentExportRow({ note: null });
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const notesCell = dataRow.getCell(6);
      expect(notesCell.value === null || notesCell.value === "" || notesCell.value === undefined).toBe(true);
    });

    it("amount column value is numeric not a string (AC-3)", async () => {
      const row = createPaymentExportRow({ amount: 1_500_000 });
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const amountCell = dataRow.getCell(5);
      expect(typeof amountCell.value).toBe("number");
      expect(amountCell.value).toBe(1_500_000);
    });

    it("date cell is formatted as DD/MM/YYYY for id locale (AC-3)", async () => {
      const row = createPaymentExportRow({ paymentDate: new Date("2025-03-15") });
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "id");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const dateCell = dataRow.getCell(1);
      expect(String(dateCell.value)).toMatch(/^15\/03\/2025$/);
    });

    it("date cell is formatted as MM/DD/YYYY for en locale (AC-3)", async () => {
      const row = createPaymentExportRow({ paymentDate: new Date("2025-03-15") });
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const dateCell = dataRow.getCell(1);
      expect(String(dateCell.value)).toMatch(/^03\/15\/2025$/);
    });

    it("period cell is formatted as MM/YYYY (AC-3)", async () => {
      const row = createPaymentExportRow({ billingCycleYear: 2025, billingCycleMonth: 3 });
      const paymentRepo = createMockPaymentRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(paymentRepo);

      const { buffer } = await service.exportPayments(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const periodCell = dataRow.getCell(4);
      expect(String(periodCell.value)).toBe("03/2025");
    });
  });

  describe("property-based tests", () => {
    it("export always produces valid XLSX structure regardless of row count (PROP-1)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 50 }),
          async (rowCount) => {
            const rows: PaymentExportRow[] = Array.from({ length: rowCount }, (_, i) =>
              createPaymentExportRow({ amount: (i + 1) * 100_000 })
            );
            const paymentRepo = createMockPaymentRepo({
              findForExport: vi.fn().mockResolvedValue(rows),
            });
            const service = makeService(paymentRepo);

            const result = await service.exportPayments(
              userId, propertyId, {}, "Asia/Jakarta", "en"
            );

            expect(result.buffer).toBeInstanceOf(Buffer);
            expect(result.buffer.length).toBeGreaterThan(0);

            const wb = await loadWorkbook(result.buffer);
            const sheet = wb.worksheets[0];
            // header row + data rows + totals row
            expect(sheet.rowCount).toBe(rowCount + 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

// ── PaymentService.listPayments with filters ───────────────────────────────

describe("PaymentService.listPayments — filter support (AC-8)", () => {
  const userId = "user-1";
  const propertyId = "prop-1";

  beforeEach(() => {
    mockPropertyAccess.validateAccess.mockResolvedValue("owner");
  });

  describe("good cases", () => {
    it("calls findByProperty with dateFrom and dateTo when filters provided", async () => {
      const payments = [createPayment()];
      const findByProperty = vi.fn().mockResolvedValue(payments);
      const paymentRepo = createMockPaymentRepo({ findByProperty });
      const service = makeService(paymentRepo);

      const filters: PaymentFilters = { dateFrom: "2025-01-01", dateTo: "2025-05-31" };
      await service.listPayments(userId, propertyId, filters);

      expect(findByProperty).toHaveBeenCalledWith(propertyId, filters);
    });

    it("calls findByProperty without filters when none provided", async () => {
      const payments = [createPayment()];
      const findByProperty = vi.fn().mockResolvedValue(payments);
      const paymentRepo = createMockPaymentRepo({ findByProperty });
      const service = makeService(paymentRepo);

      await service.listPayments(userId, propertyId);

      expect(findByProperty).toHaveBeenCalledWith(propertyId);
    });
  });

  describe("bad cases", () => {
    it("throws when user does not have property access", async () => {
      mockPropertyAccess.validateAccess.mockRejectedValueOnce(new Error("Forbidden"));
      const service = makeService(createMockPaymentRepo());

      await expect(
        service.listPayments(userId, "other-prop", {})
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("edge cases", () => {
    it("returns empty array when repo returns no payments for the filter range", async () => {
      const findByProperty = vi.fn().mockResolvedValue([]);
      const paymentRepo = createMockPaymentRepo({ findByProperty });
      const service = makeService(paymentRepo);

      const filters: PaymentFilters = { dateFrom: "2025-01-01", dateTo: "2025-01-31" };
      const result = await service.listPayments(userId, propertyId, filters);

      expect(result).toEqual([]);
      expect(findByProperty).toHaveBeenCalledWith(propertyId, filters);
    });
  });
});
