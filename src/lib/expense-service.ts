import type { IExpenseRepository } from "@/domain/interfaces/expense-repository";
import type {
  CreateExpenseInput,
  Expense,
  ExpenseCategory,
  ExpenseExportFilters,
  ExpenseExportRow,
  ExpenseFilters,
  ExpenseSummary,
  UpdateExpenseInput,
} from "@/domain/schemas/expense";
import {
  createExpenseSchema,
  updateExpenseSchema,
} from "@/domain/schemas/expense";
import type { PropertyRole } from "@/domain/schemas/property";
import type { LogActivityFn } from "@/lib/activity-log-service";
import ExcelJS from "exceljs";

export class ExportRowCapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportRowCapError";
  }
}

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class ExpenseService {
  constructor(
    private readonly repo: IExpenseRepository,
    private readonly propertyAccess: IPropertyAccessValidator,
    private readonly logActivity?: LogActivityFn
  ) {}

  async createExpense(
    userId: string,
    propertyId: string,
    data: CreateExpenseInput
  ): Promise<Expense> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const parsed = createExpenseSchema.parse(data);
    const date = new Date(parsed.date);
    const expense = await this.repo.create({
      propertyId,
      category: parsed.category,
      amount: parsed.amount,
      date,
      description: parsed.description,
      actorId: userId,
    });
    this.logActivity?.({
      propertyId,
      actorId: userId,
      actorRole: role,
      actionCode: "EXPENSE_CREATED",
      entityType: "EXPENSE",
      entityId: expense.id,
      metadata: { amount: parsed.amount, category: parsed.category },
    });
    return expense;
  }

  async listExpenses(
    userId: string,
    propertyId: string,
    filters?: ExpenseFilters
  ): Promise<Expense[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const list = await this.repo.findByProperty(propertyId, {
      year: filters?.year,
      month: filters?.month,
      category: filters?.category,
    });
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getExpense(
    userId: string,
    propertyId: string,
    expenseId: string
  ): Promise<Expense | null> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const expense = await this.repo.findById(expenseId);
    if (!expense || expense.propertyId !== propertyId) {
      return null;
    }
    return expense;
  }

  async updateExpense(
    userId: string,
    propertyId: string,
    expenseId: string,
    data: UpdateExpenseInput
  ): Promise<Expense> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.repo.findById(expenseId);
    if (!existing || existing.propertyId !== propertyId) {
      throw new Error("Expense not found");
    }
    const parsed = updateExpenseSchema.parse(data);
    const updateData: Partial<{
      category: string;
      amount: number;
      date: Date;
      description: string;
    }> = {};
    if (parsed.category !== undefined) {
      updateData.category = parsed.category;
    }
    if (parsed.amount !== undefined) {
      updateData.amount = parsed.amount;
    }
    if (parsed.date !== undefined) {
      updateData.date = new Date(parsed.date);
    }
    if (parsed.description !== undefined) {
      updateData.description = parsed.description;
    }
    if (Object.keys(updateData).length === 0) {
      return existing;
    }
    const updated = await this.repo.update(expenseId, updateData);
    this.logActivity?.({
      propertyId,
      actorId: userId,
      actorRole: role,
      actionCode: "EXPENSE_UPDATED",
      entityType: "EXPENSE",
      entityId: expenseId,
      metadata: { amount: updated.amount, category: updated.category },
    });
    return updated;
  }

  async deleteExpense(
    userId: string,
    propertyId: string,
    expenseId: string
  ): Promise<void> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.repo.findById(expenseId);
    if (!existing || existing.propertyId !== propertyId) {
      throw new Error("Expense not found");
    }
    await this.repo.delete(expenseId);
    this.logActivity?.({
      propertyId,
      actorId: userId,
      actorRole: role,
      actionCode: "EXPENSE_DELETED",
      entityType: "EXPENSE",
      entityId: expenseId,
      metadata: { amount: existing.amount, category: existing.category },
    });
  }

  async getMonthlyExpenseSummary(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<ExpenseSummary> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const [totalExpenses, categories] = await Promise.all([
      this.repo.sumByMonth(propertyId, year, month),
      this.repo.sumByMonthGroupedByCategory(propertyId, year, month),
    ]);
    const sorted = [...categories].sort((a, b) => b.total - a.total);
    return { totalExpenses, categories: sorted };
  }

  async exportExpenses(
    userId: string,
    propertyId: string,
    filters: ExpenseExportFilters,
    userTimezone: string,
    userLocale: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const rows = await this.repo.findForExport(propertyId, filters);

    if (rows.length > 10_000) {
      throw new ExportRowCapError("Export limit exceeded: maximum 10,000 rows allowed");
    }

    const buffer = await buildExpenseXlsx(rows, userTimezone, userLocale);
    const filename = buildExpenseFilename(filters, userTimezone);

    return { buffer, filename };
  }
}

const CATEGORY_LABELS_EN: Record<ExpenseCategory, string> = {
  electricity: "Electricity",
  water: "Water",
  internet: "Internet",
  maintenance: "Maintenance",
  cleaning: "Cleaning",
  supplies: "Supplies",
  tax: "Tax",
  transfer: "Transfer",
  other: "Other",
};

const CATEGORY_LABELS_ID: Record<ExpenseCategory, string> = {
  electricity: "Listrik",
  water: "Air",
  internet: "Internet",
  maintenance: "Perawatan",
  cleaning: "Kebersihan",
  supplies: "Perlengkapan",
  tax: "Pajak",
  transfer: "Transfer",
  other: "Lainnya",
};

function formatDate(date: Date, timezone: string, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  if (locale.startsWith("id")) {
    return `${get("day")}/${get("month")}/${get("year")}`;
  }
  return `${get("month")}/${get("day")}/${get("year")}`;
}

function todayInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function lastDayOfMonth(year: number, month: number): string {
  const d = new Date(Date.UTC(year, month, 0));
  const mm = String(month).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function buildExpenseFilename(filters: ExpenseExportFilters, timezone: string): string {
  if (filters.year !== undefined && filters.month !== undefined) {
    const mm = String(filters.month).padStart(2, "0");
    const firstDay = `${filters.year}-${mm}-01`;
    const lastDay = lastDayOfMonth(filters.year, filters.month);
    return `expenses-${firstDay}_to_${lastDay}.xlsx`;
  }
  return `expenses-${todayInTimezone(timezone)}.xlsx`;
}

async function buildExpenseXlsx(
  rows: ExpenseExportRow[],
  timezone: string,
  locale: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Expenses");

  sheet.columns = [
    { width: 14 },
    { width: 18 },
    { width: 18 },
    { width: 40 },
  ];

  const isId = locale.startsWith("id");
  const headers = isId
    ? ["Tanggal", "Kategori", "Jumlah (IDR)", "Deskripsi"]
    : ["Date", "Category", "Amount (IDR)", "Description"];
  const categoryLabels = isId ? CATEGORY_LABELS_ID : CATEGORY_LABELS_EN;

  sheet.addRow(headers);

  for (const row of rows) {
    sheet.addRow([
      formatDate(row.date, timezone, locale),
      categoryLabels[row.category] ?? row.category,
      row.amount,
      row.description ?? "",
    ]);
  }

  const dataRowCount = rows.length;
  const totalsRowIndex = dataRowCount + 2;
  const sumFormula = dataRowCount > 0
    ? `SUM(C2:C${dataRowCount + 1})`
    : `SUM(C2:C1)`;

  const totalsRow = sheet.addRow(["", "", { formula: sumFormula }, ""]);
  totalsRow.getCell(3).numFmt = "#,##0";
  void totalsRowIndex;

  return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
}
