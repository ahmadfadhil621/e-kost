import type { Payment } from "@/domain/schemas/payment";

export function createPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: crypto.randomUUID(),
    tenantId: crypto.randomUUID(),
    tenantName: "John Doe",
    amount: 1500000,
    paymentDate: new Date(),
    createdAt: new Date(),
    ...overrides,
  };
}
