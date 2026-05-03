import type { Payment, PaymentExportRow, PaymentFilters, PaymentPaginationOptions, PaymentWithCount } from "@/domain/schemas/payment";

export interface IPaymentRepository {
  create(data: {
    tenantId: string;
    amount: number;
    paymentDate: Date;
    billingCycleId?: string;
    note?: string;
    actorId?: string;
  }): Promise<Payment>;
  findById(id: string): Promise<Payment | null>;
  findByProperty(propertyId: string, filters?: PaymentFilters): Promise<Payment[]>;
  findByTenant(tenantId: string, options?: PaymentPaginationOptions): Promise<PaymentWithCount>;
  sumByPropertyAndMonth(
    propertyId: string,
    year: number,
    month: number
  ): Promise<number>;
  findRecentByProperty(
    propertyId: string,
    limit: number
  ): Promise<Array<{ id: string; tenantName: string; amount: number; paymentDate: Date }>>;
  findForExport(propertyId: string, filters: PaymentFilters): Promise<PaymentExportRow[]>;
  delete(id: string): Promise<void>;
}
