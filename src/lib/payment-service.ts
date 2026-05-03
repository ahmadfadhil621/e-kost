import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { IBillingCycleRepository } from "@/domain/interfaces/billing-cycle-repository";
import type {
  CreatePaymentInput,
  Payment,
  PaymentExportRow,
  PaymentFilters,
  PaymentPaginationOptions,
  PaymentWithCount,
} from "@/domain/schemas/payment";
import type { BillingCycleBreakdown } from "@/domain/schemas/billing-cycle";
import { createPaymentSchema } from "@/domain/schemas/payment";
import ExcelJS from "exceljs";
import type { PropertyRole } from "@/domain/schemas/property";
import type { RecentPayment } from "@/domain/schemas/dashboard";
import type { LogActivityFn } from "@/lib/activity-log-service";

export class ExportRowCapError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExportRowCapError";
  }
}

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

interface ICycleBreakdownProvider {
  calculateCycleBreakdown(
    userId: string,
    propertyId: string,
    tenantId: string
  ): Promise<BillingCycleBreakdown>;
}

export class PaymentService {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly tenantRepo: ITenantRepository,
    private readonly propertyAccess: IPropertyAccessValidator,
    private readonly billingCycleRepo?: IBillingCycleRepository,
    private readonly cycleBreakdownProvider?: ICycleBreakdownProvider,
    private readonly logActivity?: LogActivityFn
  ) {}

  async createPayment(
    userId: string,
    propertyId: string,
    data: CreatePaymentInput
  ): Promise<Payment> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const parsed = createPaymentSchema.parse(data);
    const tenant = await this.tenantRepo.findById(parsed.tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    if (!tenant.roomId) {
      throw new Error("Cannot record payment: tenant has no active room assignment");
    }
    if (tenant.movedOutAt) {
      throw new Error("Cannot record payment: tenant has moved out");
    }

    let billingCycleId: string | undefined;
    if (this.billingCycleRepo) {
      let targetYear: number;
      let targetMonth: number;

      if (
        parsed.billingCycleYear !== undefined &&
        parsed.billingCycleMonth !== undefined
      ) {
        targetYear = parsed.billingCycleYear;
        targetMonth = parsed.billingCycleMonth;
      } else if (this.cycleBreakdownProvider) {
        const breakdown = await this.cycleBreakdownProvider.calculateCycleBreakdown(
          userId,
          propertyId,
          parsed.tenantId
        );
        if (breakdown.unpaidCycles.length > 0) {
          targetYear = breakdown.unpaidCycles[0].year;
          targetMonth = breakdown.unpaidCycles[0].month;
        } else {
          const now = new Date();
          targetYear = now.getFullYear();
          targetMonth = now.getMonth() + 1;
        }
      } else {
        const now = new Date();
        targetYear = now.getFullYear();
        targetMonth = now.getMonth() + 1;
      }

      const cycle = await this.billingCycleRepo.findOrCreate(
        parsed.tenantId,
        targetYear,
        targetMonth
      );
      billingCycleId = cycle.id;
    }

    const paymentDate = new Date(parsed.paymentDate);
    const payment = await this.paymentRepo.create({
      tenantId: parsed.tenantId,
      amount: parsed.amount,
      paymentDate,
      billingCycleId,
      note: parsed.note,
      actorId: userId,
    });
    this.logActivity?.({
      propertyId,
      actorId: userId,
      actorRole: role,
      actionCode: "PAYMENT_RECORDED",
      entityType: "PAYMENT",
      entityId: payment.id,
      metadata: { amount: parsed.amount, tenantName: tenant.name },
    });
    return payment;
  }

  async getPayment(
    userId: string,
    propertyId: string,
    id: string
  ): Promise<Payment | null> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const payment = await this.paymentRepo.findById(id);
    if (!payment) {
      return null;
    }
    const tenant = await this.tenantRepo.findById(payment.tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      return null;
    }
    return payment;
  }

  async listPayments(userId: string, propertyId: string, filters?: PaymentFilters): Promise<Payment[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    if (filters !== undefined) {
      return this.paymentRepo.findByProperty(propertyId, filters);
    }
    return this.paymentRepo.findByProperty(propertyId);
  }

  async listTenantPayments(
    userId: string,
    propertyId: string,
    tenantId: string,
    options?: PaymentPaginationOptions
  ): Promise<PaymentWithCount> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    return this.paymentRepo.findByTenant(tenantId, options);
  }

  async getMonthlyIncome(
    userId: string,
    propertyId: string,
    year: number,
    month: number
  ): Promise<number> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    return this.paymentRepo.sumByPropertyAndMonth(propertyId, year, month);
  }

  async deletePayment(
    userId: string,
    propertyId: string,
    paymentId: string
  ): Promise<void> {
    const role = await this.propertyAccess.validateAccess(userId, propertyId);
    const payment = await this.paymentRepo.findById(paymentId);
    if (!payment) {
      throw new Error("Payment not found");
    }
    const tenant = await this.tenantRepo.findById(payment.tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Payment not found");
    }
    await this.paymentRepo.delete(paymentId);
    this.logActivity?.({
      propertyId,
      actorId: userId,
      actorRole: role,
      actionCode: "PAYMENT_DELETED",
      entityType: "PAYMENT",
      entityId: paymentId,
      metadata: { amount: payment.amount, tenantName: tenant.name },
    });
  }

  async getRecentPayments(
    userId: string,
    propertyId: string,
    limit: number
  ): Promise<RecentPayment[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const list = await this.paymentRepo.findRecentByProperty(propertyId, limit);
    return list.map((p) => ({
      paymentId: p.id,
      tenantName: p.tenantName,
      amount: p.amount,
      date: p.paymentDate,
    }));
  }

  async exportPayments(
    userId: string,
    propertyId: string,
    filters: PaymentFilters,
    userTimezone: string,
    userLocale: string
  ): Promise<{ buffer: Buffer; filename: string }> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const rows = await this.paymentRepo.findForExport(propertyId, filters);

    if (rows.length > 10_000) {
      throw new ExportRowCapError("Export limit exceeded: maximum 10,000 rows allowed");
    }

    const buffer = await buildXlsx(rows, userTimezone, userLocale);
    const filename = buildFilename(filters, userTimezone);

    return { buffer, filename };
  }
}

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

function formatPeriod(year: number | null, month: number | null): string {
  if (year === null || month === null) {return "";}
  return `${String(month).padStart(2, "0")}/${year}`;
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

function buildFilename(filters: PaymentFilters, timezone: string): string {
  if (filters.dateFrom && filters.dateTo) {
    return `payments-${filters.dateFrom}_to_${filters.dateTo}.xlsx`;
  }
  return `payments-${todayInTimezone(timezone)}.xlsx`;
}

async function buildXlsx(
  rows: PaymentExportRow[],
  timezone: string,
  locale: string
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const sheet = wb.addWorksheet("Payments");

  sheet.columns = [
    { width: 14 },
    { width: 24 },
    { width: 10 },
    { width: 10 },
    { width: 18 },
    { width: 40 },
  ];

  const headers = locale.startsWith("id")
    ? ["Tanggal", "Penyewa", "Kamar", "Periode", "Jumlah (IDR)", "Catatan"]
    : ["Date", "Tenant", "Room", "Period", "Amount (IDR)", "Notes"];
  sheet.addRow(headers);

  for (const row of rows) {
    sheet.addRow([
      formatDate(row.paymentDate, timezone, locale),
      row.tenantName,
      row.roomNumber ?? "",
      formatPeriod(row.billingCycleYear, row.billingCycleMonth),
      row.amount,
      row.note ?? "",
    ]);
  }

  const dataRowCount = rows.length;
  const totalsRowIndex = dataRowCount + 2;
  const sumRange = dataRowCount > 0
    ? `E2:E${dataRowCount + 1}`
    : `E2:E1`;

  sheet.addRow(["", "", "", "", { formula: `SUM(${sumRange})` }, ""]);

  const totalsRow = sheet.getRow(totalsRowIndex);
  totalsRow.getCell(5).numFmt = "#,##0";

  const arrayBuffer = await wb.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
