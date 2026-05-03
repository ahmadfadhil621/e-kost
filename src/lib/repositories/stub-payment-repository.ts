import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import type { Payment, PaymentExportRow, PaymentFilters, PaymentWithCount } from "@/domain/schemas/payment";

export class StubPaymentRepository implements IPaymentRepository {
  async create(): Promise<Payment> {
    throw new Error("Not implemented");
  }

  async findById(): Promise<Payment | null> {
    throw new Error("Not implemented");
  }

  async findByProperty(_propertyId: string, _filters?: PaymentFilters): Promise<Payment[]> {
    throw new Error("Not implemented");
  }

  async findByTenant(): Promise<PaymentWithCount> {
    throw new Error("Not implemented");
  }

  async sumByPropertyAndMonth(): Promise<number> {
    throw new Error("Not implemented");
  }

  async findRecentByProperty(): Promise<
    Array<{ id: string; tenantName: string; amount: number; paymentDate: Date }>
  > {
    throw new Error("Not implemented");
  }

  async findForExport(_propertyId: string, _filters: PaymentFilters): Promise<PaymentExportRow[]> {
    throw new Error("Not implemented");
  }

  async delete(): Promise<void> {
    throw new Error("Not implemented");
  }
}
