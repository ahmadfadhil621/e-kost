import { z } from "zod";

export const createPaymentSchema = z
  .object({
    tenantId: z.string().min(1, "Tenant is required"),
    amount: z
      .number()
      .positive("Amount must be positive")
      .multipleOf(0.01, "Amount must have at most 2 decimal places")
      .max(999999.99, "Amount exceeds maximum"),
    paymentDate: z
      .string()
      .min(1, "Payment date is required")
      .refine(
        (date) => {
          const d = new Date(date);
          return !Number.isNaN(d.getTime()) && d <= new Date();
        },
        "Payment date must be a valid date and cannot be in the future"
      ),
  });

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  paymentDate: Date;
  createdAt: Date;
}

export interface PaymentWithCount {
  payments: Payment[];
  count: number;
  totalPages?: number;
}

export interface PaymentPaginationOptions {
  limit?: number;
  page?: number;
}
