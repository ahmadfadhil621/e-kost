import ExcelJS from "exceljs";
import type { ICashflowRepository } from "@/domain/interfaces/cashflow-repository";
import type { CashflowEntry, CashflowExportFilters, CashflowExportRow } from "@/domain/schemas/cashflow";
import type { PropertyRole } from "@/domain/schemas/property";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class ExportRowCapError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ExportRowCapError";
  }
}

export class CashflowService {
  constructor(
    private readonly repo: ICashflowRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async getMonthlyCashflow(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<CashflowEntry[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    return this.repo.findByPropertyAndMonth(propertyId, year, month);
  }

  async exportCashflow(
    userId: string,
    propertyId: string,
    filters: CashflowExportFilters,
    userTimezone: string,
    userLocale: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const rows = await this.repo.findForExport(propertyId, filters);

    if (rows.length > 10_000) {
      throw new ExportRowCapError("Export limit exceeded: maximum 10,000 rows allowed");
    }

    const buffer = await buildCashflowXlsx(rows, userTimezone, userLocale);
    const filename = buildCashflowFilename(filters, userTimezone);

    return { buffer, filename };
  }
}

// ── i18n helpers ──────────────────────────────────────────────────────────

const TYPE_LABELS: Record<"income" | "expense", Record<string, string>> = {
  income: { en: "Income", id: "Pemasukan" },
  expense: { en: "Expense", id: "Pengeluaran" },
};

const CATEGORY_LABELS_EN: Record<string, string> = {
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

const CATEGORY_LABELS_ID: Record<string, string> = {
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

// ── date / filename helpers ───────────────────────────────────────────────

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

function buildCashflowFilename(filters: CashflowExportFilters, timezone: string): string {
  if (filters.year !== undefined && filters.month !== undefined) {
    const mm = String(filters.month).padStart(2, "0");
    return `cashflow-${filters.year}-${mm}.xlsx`;
  }
  return `cashflow-${todayInTimezone(timezone)}.xlsx`;
}

// ── XLSX builder ──────────────────────────────────────────────────────────

async function buildCashflowXlsx(
  rows: CashflowExportRow[],
  timezone: string,
  locale: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Cashflow");

  sheet.columns = [
    { width: 14 },
    { width: 12 },
    { width: 18 },
    { width: 24 },
    { width: 18 },
    { width: 40 },
  ];

  const isId = locale.startsWith("id");
  const categoryLabels = isId ? CATEGORY_LABELS_ID : CATEGORY_LABELS_EN;

  const headers = isId
    ? ["Tanggal", "Tipe", "Kategori", "Penyewa", "Jumlah (IDR)", "Catatan"]
    : ["Date", "Type", "Category", "Tenant", "Amount (IDR)", "Notes"];

  sheet.addRow(headers);

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const row of rows) {
    const typeLabel = isId
      ? TYPE_LABELS[row.type].id
      : TYPE_LABELS[row.type].en;
    const categoryLabel = row.category
      ? (categoryLabels[row.category] ?? row.category)
      : "";
    const tenantLabel = row.tenantName ?? "";
    const notesLabel = row.notes ?? "";

    sheet.addRow([
      formatDate(row.date, timezone, locale),
      typeLabel,
      categoryLabel,
      tenantLabel,
      row.type === "expense" ? -row.amount : row.amount,
      notesLabel,
    ]);

    if (row.type === "income") {
      totalIncome += row.amount;
    } else {
      totalExpenses += row.amount;
    }
  }

  const netIncome = totalIncome - totalExpenses;

  const summaryLabelIncome = isId ? "Total Pemasukan" : "Total Income";
  const summaryLabelExpenses = isId ? "Total Pengeluaran" : "Total Expenses";
  const summaryLabelNet = isId ? "Laba Bersih" : "Net Income";

  sheet.addRow([summaryLabelIncome, "", "", "", totalIncome, ""]);
  sheet.addRow([summaryLabelExpenses, "", "", "", totalExpenses, ""]);
  sheet.addRow([summaryLabelNet, "", "", "", netIncome, ""]);

  return Buffer.from(await wb.xlsx.writeBuffer() as ArrayBuffer);
}
