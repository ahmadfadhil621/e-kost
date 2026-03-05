import type { Payment, PaymentWithCount } from "@/domain/schemas/payment";

export interface IPaymentRepository {
  create(data: {
    tenantId: string;
    amount: number;
    paymentDate: Date;
  }): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByProperty(propertyId: string): Promise<Payment[]>;
  findByTenant(tenantId: string): Promise<PaymentWithCount>;
}
