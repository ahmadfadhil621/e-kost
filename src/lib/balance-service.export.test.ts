// Traceability: outstanding-balance-export (issue #123)
// REQ-1 -> it('returns buffer and filename when rows exist')
// REQ-1 -> it('XLSX sheet has 5 header columns in correct order (EN)')
// REQ-1 -> it('XLSX sheet has 5 header columns in correct order (ID)')
// REQ-1 -> it('XLSX totals row has SUM formula on Amount Owed column')
// REQ-1 -> it('amount owed cell value is numeric')
// REQ-1 -> it('months overdue cell value is numeric')
// REQ-2 -> it('calls findForExport with status=undefined when no status provided')
// REQ-2 -> it('calls findForExport with status=unpaid when status=unpaid')
// REQ-3 -> it('last payment date formatted DD/MM/YYYY for id locale')
// REQ-3 -> it('last payment date formatted MM/DD/YYYY for en locale')
// REQ-3 -> it('last payment date cell shows "Never" when null — en locale')
// REQ-3 -> it('last payment date cell shows "Belum pernah" when null — id locale')
// REQ-3 -> it('filename uses today in user timezone')
// REQ-3 -> it('monthsOverdue=0 does not produce NaN or error — monthlyRent=0 edge case')
// REQ-3 (cap) -> it('throws ExportRowCapError when repo returns more than 10,000 rows')
// REQ-3 (cap) -> it('succeeds with exactly 10,000 rows')
// PROP-1 -> it('export always produces valid XLSX structure regardless of row count')

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import ExcelJS from "exceljs";
import { BalanceService, ExportRowCapError } from "./balance-service";
import type { IBalanceRepository, OutstandingBalanceExportRow } from "./balance-service";
import { createOutstandingBalanceExportRow } from "@/test/fixtures/balance";

// ── helpers ────────────────────────────────────────────────────────────────

function createMockBalanceRepo(
  overrides: Partial<IBalanceRepository> = {}
): IBalanceRepository {
  return {
    getBalanceRow: vi.fn().mockResolvedValue(null),
    getBalanceRows: vi.fn().mockResolvedValue([]),
    getTenantInfo: vi.fn().mockResolvedValue(null),
    findForExport: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as IBalanceRepository;
}

const mockPropertyAccess = {
  validateAccess: vi.fn().mockResolvedValue("owner" as const),
};

function makeService(balanceRepo: IBalanceRepository) {
  return new BalanceService(balanceRepo, mockPropertyAccess);
}

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

// ── BalanceService.exportOutstandingBalances ───────────────────────────────

describe("BalanceService.exportOutstandingBalances", () => {
  const userId = "user-1";
  const propertyId = "prop-1";

  beforeEach(() => {
    mockPropertyAccess.validateAccess.mockResolvedValue("owner");
  });

  describe("good cases", () => {
    it("returns buffer and filename when rows exist", async () => {
      const row = createOutstandingBalanceExportRow();
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const result = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toMatch(/^outstanding-balances-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it("XLSX sheet has 5 header columns in correct order (EN)", async () => {
      const row = createOutstandingBalanceExportRow();
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const headerRow = sheet.getRow(1);

      expect(String(headerRow.getCell(1).value)).toMatch(/tenant/i);
      expect(String(headerRow.getCell(2).value)).toMatch(/room/i);
      expect(String(headerRow.getCell(3).value)).toMatch(/amount/i);
      expect(String(headerRow.getCell(4).value)).toMatch(/month/i);
      expect(String(headerRow.getCell(5).value)).toMatch(/payment/i);
    });

    it("XLSX sheet has 5 header columns in correct order (ID)", async () => {
      const row = createOutstandingBalanceExportRow();
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "id"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const headerRow = sheet.getRow(1);

      expect(String(headerRow.getCell(1).value)).toMatch(/penyewa/i);
      expect(String(headerRow.getCell(2).value)).toMatch(/kamar/i);
      expect(String(headerRow.getCell(3).value)).toMatch(/tunggakan/i);
      expect(String(headerRow.getCell(4).value)).toMatch(/bulan/i);
      expect(String(headerRow.getCell(5).value)).toMatch(/pembayaran/i);
    });

    it("XLSX totals row has SUM formula on Amount Owed column (C)", async () => {
      const row = createOutstandingBalanceExportRow({ outstandingBalance: 1_500_000 });
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      // header(1) + data(2) + totals(3)
      const totalsRow = sheet.getRow(3);
      const amountCell = totalsRow.getCell(3);
      expect(typeof amountCell.value).toBe("object");
      expect((amountCell.value as ExcelJS.CellFormulaValue).formula).toMatch(/SUM\(C2:C2\)/i);
    });

    it("amount owed cell value is numeric", async () => {
      const row = createOutstandingBalanceExportRow({ outstandingBalance: 2_000_000 });
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(typeof dataRow.getCell(3).value).toBe("number");
      expect(dataRow.getCell(3).value).toBe(2_000_000);
    });

    it("months overdue cell value is numeric", async () => {
      const row = createOutstandingBalanceExportRow({ monthsOverdue: 3 });
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(typeof dataRow.getCell(4).value).toBe("number");
      expect(dataRow.getCell(4).value).toBe(3);
    });

    it("calls findForExport with status=undefined when no status provided", async () => {
      const findForExport = vi.fn().mockResolvedValue([]);
      const balanceRepo = createMockBalanceRepo({ findForExport });
      const service = makeService(balanceRepo);

      await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      expect(findForExport).toHaveBeenCalledWith(propertyId, undefined);
    });

    it("calls findForExport with status=unpaid when status=unpaid", async () => {
      const findForExport = vi.fn().mockResolvedValue([]);
      const balanceRepo = createMockBalanceRepo({ findForExport });
      const service = makeService(balanceRepo);

      await service.exportOutstandingBalances(
        userId, propertyId, "unpaid", "Asia/Jakarta", "en"
      );

      expect(findForExport).toHaveBeenCalledWith(propertyId, "unpaid");
    });

    it("succeeds with exactly 10,000 rows", async () => {
      const rows: OutstandingBalanceExportRow[] = Array.from(
        { length: 10_000 },
        () => createOutstandingBalanceExportRow()
      );
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(balanceRepo);

      await expect(
        service.exportOutstandingBalances(userId, propertyId, "unpaid", "Asia/Jakarta", "en")
      ).resolves.not.toThrow();
    });
  });

  describe("bad cases", () => {
    it("throws ExportRowCapError when repo returns more than 10,000 rows", async () => {
      const rows: OutstandingBalanceExportRow[] = Array.from(
        { length: 10_001 },
        () => createOutstandingBalanceExportRow()
      );
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(balanceRepo);

      await expect(
        service.exportOutstandingBalances(userId, propertyId, "unpaid", "Asia/Jakarta", "en")
      ).rejects.toThrow(ExportRowCapError);
    });

    it("throws Forbidden when user does not have property access", async () => {
      mockPropertyAccess.validateAccess.mockRejectedValueOnce(new Error("Forbidden"));
      const service = makeService(createMockBalanceRepo());

      await expect(
        service.exportOutstandingBalances(userId, "other-prop", undefined, "Asia/Jakarta", "en")
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("edge cases", () => {
    it("produces valid XLSX with headers and totals row when 0 data rows", async () => {
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(balanceRepo);

      const result = await service.exportOutstandingBalances(
        userId, propertyId, "unpaid", "Asia/Jakarta", "en"
      );

      expect(result.buffer).toBeInstanceOf(Buffer);
      const wb = await loadWorkbook(result.buffer);
      const sheet = wb.worksheets[0];
      // header row + totals row only, no data rows
      expect(sheet.rowCount).toBe(2);
      const headerRow = sheet.getRow(1);
      expect(headerRow.getCell(1).value).toBeTruthy();
      const totalsRow = sheet.getRow(2);
      expect(typeof totalsRow.getCell(3).value).toBe("object"); // formula
    });

    it("last payment date cell shows \"Never\" when null — en locale", async () => {
      const row = createOutstandingBalanceExportRow({ lastPaymentDate: null });
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(String(dataRow.getCell(5).value)).toBe("Never");
    });

    it("last payment date cell shows \"Belum pernah\" when null — id locale", async () => {
      const row = createOutstandingBalanceExportRow({ lastPaymentDate: null });
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "id"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(String(dataRow.getCell(5).value)).toBe("Belum pernah");
    });

    it("last payment date formatted DD/MM/YYYY for id locale", async () => {
      const row = createOutstandingBalanceExportRow({
        lastPaymentDate: new Date("2025-03-15T00:00:00Z"),
      });
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "id"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(String(dataRow.getCell(5).value)).toMatch(/^15\/03\/2025$/);
    });

    it("last payment date formatted MM/DD/YYYY for en locale", async () => {
      const row = createOutstandingBalanceExportRow({
        lastPaymentDate: new Date("2025-03-15T00:00:00Z"),
      });
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(String(dataRow.getCell(5).value)).toMatch(/^03\/15\/2025$/);
    });

    it("monthsOverdue=0 renders as 0 in cell (fully paid tenant in all-tenants export)", async () => {
      const row = createOutstandingBalanceExportRow({
        outstandingBalance: 0,
        monthsOverdue: 0,
      });
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(balanceRepo);

      const { buffer } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(dataRow.getCell(4).value).toBe(0);
    });

    it("filename always uses today's date (no date range in filename)", async () => {
      const balanceRepo = createMockBalanceRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(balanceRepo);

      const { filename } = await service.exportOutstandingBalances(
        userId, propertyId, undefined, "Asia/Jakarta", "en"
      );

      expect(filename).toMatch(/^outstanding-balances-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });
  });

  describe("property-based tests", () => {
    it("export always produces valid XLSX structure regardless of row count (PROP-1)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 50 }),
          async (rowCount) => {
            const rows: OutstandingBalanceExportRow[] = Array.from(
              { length: rowCount },
              (_, i) => createOutstandingBalanceExportRow({ outstandingBalance: (i + 1) * 100_000 })
            );
            const balanceRepo = createMockBalanceRepo({
              findForExport: vi.fn().mockResolvedValue(rows),
            });
            const service = makeService(balanceRepo);

            const result = await service.exportOutstandingBalances(
              userId, propertyId, undefined, "Asia/Jakarta", "en"
            );

            expect(result.buffer).toBeInstanceOf(Buffer);
            expect(result.buffer.length).toBeGreaterThan(0);

            const wb = await loadWorkbook(result.buffer);
            const sheet = wb.worksheets[0];
            // header + data rows + totals row
            expect(sheet.rowCount).toBe(rowCount + 2);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
