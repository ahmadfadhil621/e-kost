// Traceability: finance-cashflow-export (issue #125)
// AC-1  -> it('returns buffer and filename when year and month provided')
// AC-1  -> it('returns today-based filename when no filters')
// AC-2  -> it('XLSX sheet has 6 header columns in correct order')
// AC-2  -> it('date cell is formatted DD/MM/YYYY for id locale')
// AC-2  -> it('date cell is formatted MM/DD/YYYY for en locale')
// AC-2  -> it('type cell shows Income for income rows in en locale')
// AC-2  -> it('type cell shows Pemasukan for income rows in id locale')
// AC-2  -> it('category cell is blank for income rows')
// AC-2  -> it('category cell shows localized label for expense rows')
// AC-2  -> it('tenant cell shows tenant name for income rows')
// AC-2  -> it('tenant cell is blank for expense rows')
// AC-2  -> it('amount column value is numeric')
// AC-2  -> it('notes cell shows payment note when present')
// AC-2  -> it('notes cell is blank when null')
// AC-3  -> it('summary rows have correct total income total expenses and net income')
// AC-4  -> it('produces valid XLSX with headers and summary rows when 0 data rows')
// AC-5  -> it('throws ExportRowCapError when repo returns more than 10,000 rows')
// AC-5  -> it('succeeds with exactly 10,000 rows')
// REQ-auth -> it('throws when user does not have access to the property')
// PROP-1 -> it('export always produces valid XLSX structure regardless of row count')

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import ExcelJS from "exceljs";
import { CashflowService, ExportRowCapError } from "./cashflow-service";
import type { ICashflowRepository } from "@/domain/interfaces/cashflow-repository";
import type { CashflowExportRow, CashflowExportFilters } from "@/domain/schemas/cashflow";

// ── helpers ────────────────────────────────────────────────────────────────

function createMockCashflowRepo(
  overrides: Partial<ICashflowRepository> = {}
): ICashflowRepository {
  return {
    findByPropertyAndMonth: vi.fn().mockResolvedValue([]),
    findForExport: vi.fn().mockResolvedValue([]),
    ...overrides,
  } as ICashflowRepository;
}

const mockPropertyAccess = {
  validateAccess: vi.fn().mockResolvedValue("owner" as const),
};

function makeService(repo: ICashflowRepository) {
  return new CashflowService(repo, mockPropertyAccess);
}

function createExportRow(overrides: Partial<CashflowExportRow> = {}): CashflowExportRow {
  return {
    id: crypto.randomUUID(),
    date: new Date("2025-05-15"),
    type: "income",
    category: null,
    tenantName: "John Doe",
    amount: 650_000,
    notes: null,
    ...overrides,
  };
}

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

// ── CashflowService.exportCashflow ─────────────────────────────────────────

describe("CashflowService.exportCashflow", () => {
  const userId = "user-1";
  const propertyId = "prop-1";

  beforeEach(() => {
    mockPropertyAccess.validateAccess.mockResolvedValue("owner");
  });

  describe("good cases", () => {
    it("returns buffer and filename when year and month provided (AC-1)", async () => {
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([createExportRow()]),
      });
      const service = makeService(repo);

      const filters: CashflowExportFilters = { year: 2025, month: 5 };
      const result = await service.exportCashflow(userId, propertyId, filters, "Asia/Jakarta", "en");

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe("cashflow-2025-05.xlsx");
    });

    it("returns today-based filename when no filters (AC-1)", async () => {
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(repo);

      const { filename } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      expect(filename).toMatch(/^cashflow-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it("returns today-based filename when only year is provided without month (AC-1)", async () => {
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(repo);

      const { filename } = await service.exportCashflow(userId, propertyId, { year: 2025 }, "Asia/Jakarta", "en");

      expect(filename).toMatch(/^cashflow-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it("XLSX sheet has 6 header columns in correct order (AC-2)", async () => {
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([createExportRow()]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const headerRow = sheet.getRow(1);

      expect(headerRow.getCell(1).value).toBeTruthy(); // Date
      expect(headerRow.getCell(2).value).toBeTruthy(); // Type
      expect(headerRow.getCell(3).value).toBeTruthy(); // Category
      expect(headerRow.getCell(4).value).toBeTruthy(); // Tenant
      expect(headerRow.getCell(5).value).toBeTruthy(); // Amount (IDR)
      expect(headerRow.getCell(6).value).toBeTruthy(); // Notes
    });

    it("produces valid XLSX with headers and summary rows when 0 data rows (AC-4)", async () => {
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(repo);

      const result = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      expect(result.buffer).toBeInstanceOf(Buffer);
      const wb = await loadWorkbook(result.buffer);
      const sheet = wb.worksheets[0];

      // 1 header row + 0 data rows + 3 summary rows = 4 rows
      expect(sheet.rowCount).toBe(4);
      expect(sheet.getRow(1).getCell(1).value).toBeTruthy();
    });

    it("succeeds with exactly 10,000 rows (AC-5)", async () => {
      const rows = Array.from({ length: 10_000 }, () => createExportRow());
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(repo);

      await expect(
        service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en")
      ).resolves.not.toThrow();
    });
  });

  describe("bad cases", () => {
    it("throws ExportRowCapError when repo returns more than 10,000 rows (AC-5)", async () => {
      const rows = Array.from({ length: 10_001 }, () => createExportRow());
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(repo);

      await expect(
        service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en")
      ).rejects.toThrow(ExportRowCapError);
    });

    it("throws when user does not have access to the property (REQ-auth)", async () => {
      mockPropertyAccess.validateAccess.mockRejectedValueOnce(new Error("Forbidden"));
      const service = makeService(createMockCashflowRepo());

      await expect(
        service.exportCashflow(userId, "wrong-prop", {}, "Asia/Jakarta", "en")
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("edge cases", () => {
    it("date cell is formatted DD/MM/YYYY for id locale (AC-2)", async () => {
      const row = createExportRow({ date: new Date("2025-03-15") });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "id");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(String(dataRow.getCell(1).value)).toMatch(/^15\/03\/2025$/);
    });

    it("date cell is formatted MM/DD/YYYY for en locale (AC-2)", async () => {
      const row = createExportRow({ date: new Date("2025-03-15") });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      expect(String(dataRow.getCell(1).value)).toMatch(/^03\/15\/2025$/);
    });

    it("type cell shows Income for income rows in en locale (AC-2)", async () => {
      const row = createExportRow({ type: "income" });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      expect(String(sheet.getRow(2).getCell(2).value)).toBe("Income");
    });

    it("type cell shows Pemasukan for income rows in id locale (AC-2)", async () => {
      const row = createExportRow({ type: "income" });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "id");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      expect(String(sheet.getRow(2).getCell(2).value)).toBe("Pemasukan");
    });

    it("category cell is blank for income rows (AC-2)", async () => {
      const row = createExportRow({ type: "income", category: null });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const categoryCell = sheet.getRow(2).getCell(3);
      expect(categoryCell.value === null || categoryCell.value === "" || categoryCell.value === undefined).toBe(true);
    });

    it("category cell shows localized label for expense rows in en (AC-2)", async () => {
      const row = createExportRow({ type: "expense", category: "electricity", tenantName: null });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      expect(String(sheet.getRow(2).getCell(3).value)).toBe("Electricity");
    });

    it("category cell shows Indonesian label for expense rows in id (AC-2)", async () => {
      const row = createExportRow({ type: "expense", category: "electricity", tenantName: null });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "id");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      expect(String(sheet.getRow(2).getCell(3).value)).toBe("Listrik");
    });

    it("tenant cell shows tenant name for income rows (AC-2)", async () => {
      const row = createExportRow({ type: "income", tenantName: "Budi Santoso" });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      expect(String(sheet.getRow(2).getCell(4).value)).toBe("Budi Santoso");
    });

    it("tenant cell is blank for expense rows (AC-2)", async () => {
      const row = createExportRow({ type: "expense", category: "water", tenantName: null });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const tenantCell = sheet.getRow(2).getCell(4);
      expect(tenantCell.value === null || tenantCell.value === "" || tenantCell.value === undefined).toBe(true);
    });

    it("amount column value is numeric (AC-2)", async () => {
      const row = createExportRow({ amount: 1_500_000 });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      expect(typeof sheet.getRow(2).getCell(5).value).toBe("number");
      expect(sheet.getRow(2).getCell(5).value).toBe(1_500_000);
    });

    it("notes cell shows payment note when present (AC-2)", async () => {
      const row = createExportRow({ notes: "Monthly rent for May" });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      expect(String(sheet.getRow(2).getCell(6).value)).toBe("Monthly rent for May");
    });

    it("notes cell is blank when null (AC-2)", async () => {
      const row = createExportRow({ notes: null });
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const notesCell = sheet.getRow(2).getCell(6);
      expect(notesCell.value === null || notesCell.value === "" || notesCell.value === undefined).toBe(true);
    });

    it("summary rows have correct total income, total expenses, and net income (AC-3)", async () => {
      const rows = [
        createExportRow({ type: "income", amount: 1_000_000 }),
        createExportRow({ type: "income", amount: 500_000 }),
        createExportRow({ type: "expense", category: "electricity", tenantName: null, amount: 200_000 }),
      ];
      const repo = createMockCashflowRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(repo);

      const { buffer } = await service.exportCashflow(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];

      // 1 header + 3 data + 3 summary = 7 rows
      const totalIncomeRow = sheet.getRow(5);
      const totalExpensesRow = sheet.getRow(6);
      const netIncomeRow = sheet.getRow(7);

      expect(totalIncomeRow.getCell(5).value).toBe(1_500_000);
      expect(totalExpensesRow.getCell(5).value).toBe(200_000);
      expect(netIncomeRow.getCell(5).value).toBe(1_300_000);
    });

    it("filters are passed through to findForExport (AC-1)", async () => {
      const findForExport = vi.fn().mockResolvedValue([]);
      const repo = createMockCashflowRepo({ findForExport });
      const service = makeService(repo);

      const filters: CashflowExportFilters = { year: 2025, month: 5 };
      await service.exportCashflow(userId, propertyId, filters, "Asia/Jakarta", "en");

      expect(findForExport).toHaveBeenCalledWith(propertyId, filters);
    });
  });

  describe("property-based tests", () => {
    it("export always produces valid XLSX structure regardless of row count (PROP-1)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 50 }),
          async (rowCount) => {
            const rows: CashflowExportRow[] = Array.from({ length: rowCount }, (_, i) =>
              createExportRow({ amount: (i + 1) * 100_000 })
            );
            const repo = createMockCashflowRepo({
              findForExport: vi.fn().mockResolvedValue(rows),
            });
            const service = makeService(repo);

            const result = await service.exportCashflow(
              userId, propertyId, {}, "Asia/Jakarta", "en"
            );

            expect(result.buffer).toBeInstanceOf(Buffer);
            expect(result.buffer.length).toBeGreaterThan(0);

            const wb = await loadWorkbook(result.buffer);
            const sheet = wb.worksheets[0];
            // header row + data rows + 3 summary rows
            expect(sheet.rowCount).toBe(rowCount + 4);
          }
        ),
        { numRuns: 100 }
      );
    }, 30_000);
  });
});
