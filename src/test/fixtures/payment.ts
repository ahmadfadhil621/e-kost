import type { Payment, PaymentExportRow } from "@/domain/schemas/payment";

export function createPayment(overrides: Partial<Payment> = {}): Payment {
  return {
    id: crypto.randomUUID(),
    tenantId: crypto.randomUUID(),
    tenantName: "John Doe",
    amount: 650,
    paymentDate: new Date(),
    createdAt: new Date(),
    note: null,
    ...overrides,
  };
}

export function createPaymentExportRow(overrides: Partial<PaymentExportRow> = {}): PaymentExportRow {
  return {
    paymentDate: new Date("2025-05-01"),
    tenantName: "John Doe",
    roomNumber: "101",
    billingCycleYear: 2025,
    billingCycleMonth: 5,
    amount: 1_500_000,
    note: null,
    ...overrides,
  };
}
