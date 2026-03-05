import type { IPaymentRepository } from "@/domain/interfaces/payment-repository";
import type { Payment, PaymentWithCount } from "@/domain/schemas/payment";

export class StubPaymentRepository implements IPaymentRepository {
  async create(): Promise<Payment> {
    throw new Error("Not implemented");
  }

  async findById(): Promise<Payment | null> {
    throw new Error("Not implemented");
  }

  async findByProperty(): Promise<Payment[]> {
    throw new Error("Not implemented");
  }

  async findByTenant(): Promise<PaymentWithCount> {
    throw new Error("Not implemented");
  }
}
