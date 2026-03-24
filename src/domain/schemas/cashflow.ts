import { z } from "zod";

export const cashflowQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export interface CashflowEntry {
  id: string;
  date: string;
  type: "income" | "expense";
  description: string;
  amount: number;
}
