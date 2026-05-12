import { z } from "zod";

export const cashflowQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export const cashflowExportQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

export interface CashflowEntry {
  id: string;
  date: string;
  type: "income" | "expense";
  description: string;
  amount: number;
}

export interface CashflowExportRow {
  id: string;
  date: Date;
  type: "income" | "expense";
  category: string | null;
  tenantName: string | null;
  amount: number;
  notes: string | null;
}

export interface CashflowExportFilters {
  year?: number;
  month?: number;
}
