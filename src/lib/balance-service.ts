import ExcelJS from "exceljs";
import type { OutstandingBalance } from "@/domain/schemas/dashboard";
import type { BillingCycleBreakdown, CycleStatus } from "@/domain/schemas/billing-cycle";
import type { IBillingCycleRepository } from "@/domain/interfaces/billing-cycle-repository";

/**
 * BalanceService per specs/outstanding-balance/design.md.
 * Computes outstanding balance = totalRentOwed - totalPayments, status = paid when balance <= 0.
 * totalRentOwed = monthlyRent × months elapsed since move-in (inclusive).
 */
export type BalanceStatus = "paid" | "unpaid";

export interface BalanceResult {
  tenantId: string;
  tenantName?: string;
  roomNumber?: string;
  monthlyRent: number;
  totalRentOwed: number;
  totalPayments: number;
  outstandingBalance: number;
  status: BalanceStatus;
}

export interface BalanceRow {
  tenantId: string;
  tenantName: string;
  roomNumber: string;
  monthlyRent: number;
  /** Total rent owed across all months since move-in (monthlyRent × months elapsed). */
  totalRentOwed: number;
  totalPayments: number;
}

export interface OutstandingBalanceExportRow {
  tenantName: string;
  roomNumber: string;
  outstandingBalance: number;
  monthsOverdue: number;
  lastPaymentDate: Date | null;
}

export class ExportRowCapError extends Error {
  constructor(msg: string) {
    super(msg);
    this.name = "ExportRowCapError";
  }
}

export interface IBalanceRepository {
  getBalanceRow(
    propertyId: string,
    tenantId: string
  ): Promise<BalanceRow | null>;
  getBalanceRows(
    propertyId: string,
    status?: "paid" | "unpaid"
  ): Promise<BalanceRow[]>;
  getTenantInfo(
    propertyId: string,
    tenantId: string
  ): Promise<{ monthlyRent: number; movedInAt: Date; billingDayOfMonth: number | null } | null>;
  findForExport(
    propertyId: string,
    status?: "paid" | "unpaid"
  ): Promise<OutstandingBalanceExportRow[]>;
}

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<"owner" | "staff">;
}

/** Returns the number of days in a given month (1-based month). */
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Clamps a billing day to the actual last day of the given month.
 * E.g. clampDay(31, 2026, 2) → 28 (February 2026).
 */
export function clampDay(day: number, year: number, month: number): number {
  return Math.min(day, daysInMonth(year, month));
}

/**
 * Returns the effective billing day of month:
 * uses billingDayOfMonth when set, otherwise falls back to the day of movedInAt.
 */
export function effectiveBillingDay(
  billingDayOfMonth: number | null,
  movedInAt: Date
): number {
  return billingDayOfMonth ?? movedInAt.getDate();
}

function toResult(row: BalanceRow): BalanceResult {
  const outstandingBalance = Math.max(0, row.totalRentOwed - row.totalPayments);
  const status: BalanceStatus =
    outstandingBalance <= 0 ? "paid" : "unpaid";
  return {
    tenantId: row.tenantId,
    tenantName: row.tenantName,
    roomNumber: row.roomNumber,
    monthlyRent: row.monthlyRent,
    totalRentOwed: row.totalRentOwed,
    totalPayments: row.totalPayments,
    outstandingBalance,
    status,
  };
}

export class BalanceService {
  constructor(
    private readonly balanceRepo: IBalanceRepository,
    private readonly propertyAccess: IPropertyAccessValidator,
    private readonly billingCycleRepo?: IBillingCycleRepository
  ) {}

  async calculateBalance(
    userId: string,
    propertyId: string,
    tenantId: string
  ): Promise<BalanceResult> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const row = await this.balanceRepo.getBalanceRow(propertyId, tenantId);
    if (!row) {
      throw new Error(
        "Cannot calculate balance: tenant not found or has no room assignment"
      );
    }
    return toResult(row);
  }

  async calculateBalances(
    userId: string,
    propertyId: string,
    status?: "paid" | "unpaid"
  ): Promise<BalanceResult[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const rows = await this.balanceRepo.getBalanceRows(propertyId, status);
    return rows.map(toResult);
  }

  async getTopOutstandingBalances(
    userId: string,
    propertyId: string,
    limit: number
  ): Promise<{ balances: OutstandingBalance[]; totalCount: number }> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const rows = await this.balanceRepo.getBalanceRows(propertyId, "unpaid");
    const withBalance = rows.map((r) => ({
      ...r,
      balance: Math.max(0, r.totalRentOwed - r.totalPayments),
    }));
    withBalance.sort((a, b) => b.balance - a.balance);
    const totalCount = withBalance.length;
    const top = withBalance.slice(0, limit);
    const balances: OutstandingBalance[] = top.map((r) => ({
      tenantId: r.tenantId,
      tenantName: r.tenantName,
      roomNumber: r.roomNumber,
      balance: r.balance,
    }));
    return { balances, totalCount };
  }

  async calculateCycleBreakdown(
    userId: string,
    propertyId: string,
    tenantId: string
  ): Promise<BillingCycleBreakdown> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const info = await this.balanceRepo.getTenantInfo(propertyId, tenantId);
    if (!info) {
      throw new Error(
        "Cannot calculate balance: tenant not found or has no room assignment"
      );
    }

    const cycleRepo = this.billingCycleRepo;
    const existingSums = cycleRepo
      ? await cycleRepo.findWithPaymentSums(tenantId)
      : [];

    const sumsMap = new Map<string, { id: string; totalPaid: number }>();
    for (const s of existingSums) {
      sumsMap.set(`${s.year}-${s.month}`, { id: s.id, totalPaid: s.totalPaid });
    }

    const now = new Date();
    const endYear = now.getFullYear();
    const endMonth = now.getMonth() + 1;

    const moveIn = new Date(info.movedInAt);
    let curYear = moveIn.getFullYear();
    let curMonth = moveIn.getMonth() + 1;

    const allCycles: CycleStatus[] = [];

    while (
      curYear < endYear ||
      (curYear === endYear && curMonth <= endMonth)
    ) {
      const key = `${curYear}-${curMonth}`;
      const entry = sumsMap.get(key);
      const totalPaid = entry?.totalPaid ?? 0;
      const amountOwed = Math.max(0, info.monthlyRent - totalPaid);
      let status: CycleStatus["status"];
      if (totalPaid >= info.monthlyRent) {
        status = "paid";
      } else if (totalPaid > 0) {
        status = "partial";
      } else {
        status = "unpaid";
      }
      allCycles.push({
        year: curYear,
        month: curMonth,
        cycleId: entry?.id ?? null,
        totalPaid,
        monthlyRent: info.monthlyRent,
        status,
        amountOwed,
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    const unpaidCycles = allCycles.filter((c) => c.status !== "paid");
    const billingDay = effectiveBillingDay(info.billingDayOfMonth, new Date(info.movedInAt));
    return {
      tenantId,
      unpaidCycles,
      allPaid: unpaidCycles.length === 0,
      billingDayOfMonth: billingDay,
    };
  }

  async exportOutstandingBalances(
    userId: string,
    propertyId: string,
    status: "paid" | "unpaid" | undefined,
    userTimezone: string,
    userLocale: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const rows = await this.balanceRepo.findForExport(propertyId, status);

    if (rows.length > 10_000) {
      throw new ExportRowCapError("Export limit exceeded: maximum 10,000 rows allowed");
    }

    const buffer = await buildBalanceXlsx(rows, userTimezone, userLocale);
    const filename = `outstanding-balances-${todayInTimezone(userTimezone)}.xlsx`;

    return { buffer, filename };
  }
}

// ── XLSX helpers ────────────────────────────────────────────────────────────

function todayInTimezone(timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function formatDate(date: Date, timezone: string, locale: string): string {
  const fmt = new Intl.DateTimeFormat(locale, {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const parts = fmt.formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  if (locale.startsWith("id")) {
    return `${get("day")}/${get("month")}/${get("year")}`;
  }
  return `${get("month")}/${get("day")}/${get("year")}`;
}

async function buildBalanceXlsx(
  rows: OutstandingBalanceExportRow[],
  timezone: string,
  locale: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Outstanding Balances");

  sheet.columns = [
    { width: 24 },
    { width: 10 },
    { width: 18 },
    { width: 14 },
    { width: 18 },
  ];

  const isId = locale.startsWith("id");
  const headers = isId
    ? ["Penyewa", "Kamar", "Tunggakan (IDR)", "Bulan Tunggak", "Pembayaran Terakhir"]
    : ["Tenant", "Room", "Amount Owed (IDR)", "Months Overdue", "Last Payment Date"];
  const neverLabel = isId ? "Belum pernah" : "Never";

  sheet.addRow(headers);

  for (const row of rows) {
    const lastPayment = row.lastPaymentDate === null
      ? neverLabel
      : formatDate(row.lastPaymentDate, timezone, locale);
    sheet.addRow([
      row.tenantName,
      row.roomNumber,
      row.outstandingBalance,
      row.monthsOverdue,
      lastPayment,
    ]);
  }

  const dataRowCount = rows.length;
  const sumRange = dataRowCount > 0 ? `C2:C${dataRowCount + 1}` : `C2:C1`;
  sheet.addRow(["", "", { formula: `SUM(${sumRange})` }, "", ""]);

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
