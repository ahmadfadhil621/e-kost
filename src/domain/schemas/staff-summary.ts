import { z } from "zod";

export const staffSummaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export interface StaffSummaryEntry {
  actorId: string;
  actorName: string;
  actorRole: string;
  totalPayments: number;
  totalExpenses: number;
}

export type StaffSummaryQuery = z.infer<typeof staffSummaryQuerySchema>;
