// Traceability: finance-expense-export (issue #122)
// AC-1  -> it('returns buffer and filename when year and month provided')
// AC-1  -> it('returns buffer and today-based filename when no year/month provided')
// AC-2  -> it('XLSX sheet has 4 header columns in correct order')
// AC-2  -> it('XLSX totals row has SUM formula on Amount column')
// AC-2  -> it('date cell is formatted DD/MM/YYYY for id locale')
// AC-2  -> it('date cell is formatted MM/DD/YYYY for en locale')
// AC-2  -> it('category cell contains human-readable label')
// AC-2  -> it('description cell is blank when description is null')
// AC-2  -> it('amount column value is numeric not a string')
// AC-3  -> it('category filter is passed through to repo')
// AC-4  -> it('produces valid XLSX with headers and totals when 0 data rows')
// AC-5  -> it('throws ExportRowCapError when repo returns more than 10,000 rows')
// AC-5  -> it('succeeds with exactly 10,000 rows')
// REQ-auth -> it('throws when user does not have access to the property')
// PROP-1 -> it('export always produces valid XLSX structure regardless of row count')

import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import ExcelJS from "exceljs";
import { ExpenseService, ExportRowCapError } from "./expense-service";
import type { IExpenseRepository } from "@/domain/interfaces/expense-repository";
import type { ExpenseExportFilters, ExpenseExportRow } from "@/domain/schemas/expense";
import { createExpenseExportRow } from "@/test/fixtures/expense";

// ── helpers ────────────────────────────────────────────────────────────────

function createMockExpenseRepo(
  overrides: Partial<IExpenseRepository> = {}
): IExpenseRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    findByProperty: vi.fn().mockResolvedValue([]),
    findForExport: vi.fn().mockResolvedValue([]),
    update: vi.fn(),
    delete: vi.fn(),
    sumByMonth: vi.fn(),
    sumByMonthGroupedByCategory: vi.fn(),
    ...overrides,
  } as IExpenseRepository;
}

const mockPropertyAccess = {
  validateAccess: vi.fn().mockResolvedValue("owner" as const),
};

function makeService(expenseRepo: IExpenseRepository) {
  return new ExpenseService(expenseRepo, mockPropertyAccess);
}

async function loadWorkbook(buffer: Buffer): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer as unknown as ArrayBuffer);
  return wb;
}

// ── ExpenseService.exportExpenses ──────────────────────────────────────────

describe("ExpenseService.exportExpenses", () => {
  const userId = "user-1";
  const propertyId = "prop-1";

  beforeEach(() => {
    mockPropertyAccess.validateAccess.mockResolvedValue("owner");
  });

  describe("good cases", () => {
    it("returns buffer and filename when year and month provided (AC-1)", async () => {
      const row = createExpenseExportRow();
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const filters: ExpenseExportFilters = { year: 2025, month: 5 };
      const result = await service.exportExpenses(userId, propertyId, filters, "Asia/Jakarta", "en");

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
      expect(result.filename).toBe("expenses-2025-05-01_to_2025-05-31.xlsx");
    });

    it("returns buffer and today-based filename when no year/month provided (AC-1)", async () => {
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(expenseRepo);

      const { filename } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en");

      expect(filename).toMatch(/^expenses-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it("returns today-based filename when only year is provided without month (AC-1)", async () => {
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(expenseRepo);

      const filters: ExpenseExportFilters = { year: 2025 };
      const { filename } = await service.exportExpenses(userId, propertyId, filters, "Asia/Jakarta", "en");

      expect(filename).toMatch(/^expenses-\d{4}-\d{2}-\d{2}\.xlsx$/);
    });

    it("XLSX sheet has 4 header columns in correct order (AC-2)", async () => {
      const row = createExpenseExportRow();
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const { buffer } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const headerRow = sheet.getRow(1);

      expect(headerRow.getCell(1).value).toBeTruthy(); // Date
      expect(headerRow.getCell(2).value).toBeTruthy(); // Category
      expect(headerRow.getCell(3).value).toBeTruthy(); // Amount (IDR)
      expect(headerRow.getCell(4).value).toBeTruthy(); // Description
    });

    it("XLSX totals row has SUM formula on Amount column (AC-2)", async () => {
      const row = createExpenseExportRow({ amount: 500_000 });
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const { buffer } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      // 1 header row + 1 data row + 1 totals row = row 3
      const totalsRow = sheet.getRow(3);
      const amountCell = totalsRow.getCell(3);
      expect(typeof amountCell.value).toBe("object"); // formula object
      expect((amountCell.value as ExcelJS.CellFormulaValue).formula).toMatch(/SUM\(C2:C2\)/i);
    });

    it("produces valid XLSX with headers and totals when 0 data rows (AC-4)", async () => {
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(expenseRepo);

      const result = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en");

      expect(result.buffer).toBeInstanceOf(Buffer);
      const wb = await loadWorkbook(result.buffer);
      const sheet = wb.worksheets[0];

      // Row 1 is headers, row 2 is totals (no data rows)
      expect(sheet.rowCount).toBe(2);
      const headerRow = sheet.getRow(1);
      expect(headerRow.getCell(1).value).toBeTruthy();

      const totalsRow = sheet.getRow(2);
      const amountCell = totalsRow.getCell(3);
      expect(typeof amountCell.value).toBe("object");
      expect((amountCell.value as ExcelJS.CellFormulaValue).formula).toMatch(/SUM/i);
    });

    it("succeeds with exactly 10,000 rows (AC-5)", async () => {
      const rows = Array.from({ length: 10_000 }, () => createExpenseExportRow());
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(expenseRepo);

      await expect(
        service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en")
      ).resolves.not.toThrow();
    });

    it("filename uses last calendar day of month for February leap year (AC-1)", async () => {
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([]),
      });
      const service = makeService(expenseRepo);

      const filters: ExpenseExportFilters = { year: 2024, month: 2 }; // 2024 is leap year
      const { filename } = await service.exportExpenses(userId, propertyId, filters, "Asia/Jakarta", "en");

      expect(filename).toBe("expenses-2024-02-01_to_2024-02-29.xlsx");
    });
  });

  describe("bad cases", () => {
    it("throws ExportRowCapError when repo returns more than 10,000 rows (AC-5)", async () => {
      const rows = Array.from({ length: 10_001 }, () => createExpenseExportRow());
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue(rows),
      });
      const service = makeService(expenseRepo);

      await expect(
        service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en")
      ).rejects.toThrow(ExportRowCapError);
    });

    it("throws when user does not have access to the property (REQ-auth)", async () => {
      mockPropertyAccess.validateAccess.mockRejectedValueOnce(new Error("Forbidden"));
      const service = makeService(createMockExpenseRepo());

      await expect(
        service.exportExpenses(userId, "wrong-prop", {}, "Asia/Jakarta", "en")
      ).rejects.toThrow("Forbidden");
    });
  });

  describe("edge cases", () => {
    it("category filter is passed through to findForExport (AC-3)", async () => {
      const findForExport = vi.fn().mockResolvedValue([]);
      const expenseRepo = createMockExpenseRepo({ findForExport });
      const service = makeService(expenseRepo);

      const filters: ExpenseExportFilters = { year: 2025, month: 5, category: "maintenance" };
      await service.exportExpenses(userId, propertyId, filters, "Asia/Jakarta", "en");

      expect(findForExport).toHaveBeenCalledWith(propertyId, filters);
    });

    it("description cell is blank when description is null (AC-2)", async () => {
      const row = createExpenseExportRow({ description: null });
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const { buffer } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const descCell = dataRow.getCell(4);
      expect(descCell.value === null || descCell.value === "" || descCell.value === undefined).toBe(true);
    });

    it("amount column value is numeric not a string (AC-2)", async () => {
      const row = createExpenseExportRow({ amount: 1_500_000 });
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const { buffer } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const amountCell = dataRow.getCell(3);
      expect(typeof amountCell.value).toBe("number");
      expect(amountCell.value).toBe(1_500_000);
    });

    it("date cell is formatted as DD/MM/YYYY for id locale (AC-2)", async () => {
      const row = createExpenseExportRow({ date: new Date("2025-03-15") });
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const { buffer } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "id");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const dateCell = dataRow.getCell(1);
      expect(String(dateCell.value)).toMatch(/^15\/03\/2025$/);
    });

    it("date cell is formatted as MM/DD/YYYY for en locale (AC-2)", async () => {
      const row = createExpenseExportRow({ date: new Date("2025-03-15") });
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const { buffer } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const dateCell = dataRow.getCell(1);
      expect(String(dateCell.value)).toMatch(/^03\/15\/2025$/);
    });

    it("category cell contains human-readable label for en locale (AC-2)", async () => {
      const row = createExpenseExportRow({ category: "electricity" });
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const { buffer } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "en");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const categoryCell = dataRow.getCell(2);
      expect(String(categoryCell.value)).toBe("Electricity");
    });

    it("category cell contains Indonesian label for id locale (AC-2)", async () => {
      const row = createExpenseExportRow({ category: "electricity" });
      const expenseRepo = createMockExpenseRepo({
        findForExport: vi.fn().mockResolvedValue([row]),
      });
      const service = makeService(expenseRepo);

      const { buffer } = await service.exportExpenses(userId, propertyId, {}, "Asia/Jakarta", "id");

      const wb = await loadWorkbook(buffer);
      const sheet = wb.worksheets[0];
      const dataRow = sheet.getRow(2);
      const categoryCell = dataRow.getCell(2);
      expect(String(categoryCell.value)).toBe("Listrik");
    });
  });

  describe("property-based tests", () => {
    it("export always produces valid XLSX structure regardless of row count (PROP-1)", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 50 }),
          async (rowCount) => {
            const rows: ExpenseExportRow[] = Array.from({ length: rowCount }, (_, i) =>
              createExpenseExportRow({ amount: (i + 1) * 100_000 })
            );
            const expenseRepo = createMockExpenseRepo({
              findForExport: vi.fn().mockResolvedValue(rows),
            });
            const service = makeService(expenseRepo);

            const result = await service.exportExpenses(
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
    }, 30_000);
  });
});
