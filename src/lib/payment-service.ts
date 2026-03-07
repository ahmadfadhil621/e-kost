import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type {
  CreatePaymentInput,
  Payment,
  PaymentWithCount,
} from "@/domain/schemas/payment";
import { createPaymentSchema } from "@/domain/schemas/payment";
import type { PropertyRole } from "@/domain/schemas/property";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class PaymentService {
  constructor(
    private readonly paymentRepo: IPaymentRepository,
    private readonly tenantRepo: ITenantRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async createPayment(
    userId: string,
    propertyId: string,
    data: CreatePaymentInput
  ): Promise<Payment> {
    await this.propertyAccess.validateAccess(userId, propertyId);
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
    const paymentDate = new Date(parsed.paymentDate);
    return this.paymentRepo.create({
      tenantId: parsed.tenantId,
      amount: parsed.amount,
      paymentDate,
    });
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
    tenantId: string
  ): Promise<PaymentWithCount> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    return this.paymentRepo.findByTenant(tenantId);
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
}
