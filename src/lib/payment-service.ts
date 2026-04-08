import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { IBillingCycleRepository } from "@/domain/interfaces/billing-cycle-repository";
import type {
  CreatePaymentInput,
  Payment,
  PaymentPaginationOptions,
  PaymentWithCount,
} from "@/domain/schemas/payment";
import type { BillingCycleBreakdown } from "@/domain/schemas/billing-cycle";
import { createPaymentSchema } from "@/domain/schemas/payment";
import type { PropertyRole } from "@/domain/schemas/property";
import type { RecentPayment } from "@/domain/schemas/dashboard";
import type { LogActivityFn } from "@/lib/activity-log-service";

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

  async listPayments(userId: string, propertyId: string): Promise<Payment[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
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
}
