import { z } from "zod";

export const expenseCategories = [
  "electricity",
  "water",
  "internet",
  "maintenance",
  "cleaning",
  "supplies",
  "tax",
  "transfer",
  "other",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];

export const createExpenseSchema = z.object({
  category: z.enum(expenseCategories),
  amount: z.number().positive("Amount must be positive"),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !Number.isNaN(Date.parse(val)), "Invalid date"),
  description: z.string().max(1000).trim().optional(),
});

export const updateExpenseSchema = z
  .object({
    category: z.enum(expenseCategories).optional(),
    amount: z.number().positive("Amount must be positive").optional(),
    date: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), "Invalid date")
      .optional(),
    description: z.string().max(1000).trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const financeSummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export interface Expense {
  id: string;
  propertyId: string;
  category: ExpenseCategory;
  amount: number;
  date: Date;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExpenseFilters {
  year?: number;
  month?: number;
  category?: ExpenseCategory;
}

export interface CategoryBreakdown {
  category: ExpenseCategory;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  totalExpenses: number;
  categories: CategoryBreakdown[];
}

export interface FinanceSummary {
  year: number;
  month: number;
  income: number;
  expenses: number;
  netIncome: number;
  categoryBreakdown: CategoryBreakdown[];
}
