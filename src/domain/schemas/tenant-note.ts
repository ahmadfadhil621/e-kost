import { z } from "zod";

export const createNoteSchema = z.object({
  content: z
    .string()
    .min(1, "Note content is required")
    .max(2000, "Note must be 2000 characters or fewer")
    .trim(),
  date: z
    .string()
    .min(1, "Date is required")
    .refine((val) => !Number.isNaN(Date.parse(val)), "Please enter a valid date"),
});

export const updateNoteSchema = z
  .object({
    content: z
      .string()
      .min(1, "Note content is required")
      .max(2000, "Note must be 2000 characters or fewer")
      .trim()
      .optional(),
    date: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), "Please enter a valid date")
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0 && (data.content !== undefined || data.date !== undefined), {
    message: "At least one field must be provided",
  });

export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;

export interface TenantNote {
  id: string;
  tenantId: string;
  content: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}
