import { z } from "zod";

export const createPropertySchema = z.object({
  name: z
    .string()
    .min(1, "Property name is required")
    .max(200)
    .trim(),
  address: z
    .string()
    .min(1, "Address is required")
    .max(500)
    .trim(),
  currency: z
    .string()
    .min(3, "Currency is required")
    .max(3)
    .transform((s) => s.toUpperCase()),
});

export const updatePropertySchema = z
  .object({
    name: z.string().min(1).max(200).trim().optional(),
    address: z.string().min(1).max(500).trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const updatePropertySettingsSchema = z.object({
  staffOnlyFinance: z.boolean(),
});

export const addStaffSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;
export type UpdatePropertySettings = z.infer<typeof updatePropertySettingsSchema>;
export type AddStaffInput = z.infer<typeof addStaffSchema>;

export interface Property {
  id: string;
  name: string;
  address: string;
  currency: string;
  ownerId: string;
  staffOnlyFinance: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  archivedAt: Date | null;
}

export type PropertyRole = "owner" | "staff";

export interface PropertyStaff {
  id: string;
  propertyId: string;
  userId: string;
  user: { id: string; name: string; email: string };
  assignedAt: Date;
}
