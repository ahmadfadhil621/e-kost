import { z } from "zod";

export const createTenantSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(255)
    .trim(),
  phone: z
    .string()
    .min(1, "Phone is required")
    .max(50)
    .trim(),
  email: z
    .string()
    .min(1, "Email is required")
    .max(255)
    .trim()
    .email("Invalid email format"),
});

export const updateTenantSchema = z
  .object({
    name: z.string().min(1).max(255).trim().optional(),
    phone: z.string().min(1).max(50).trim().optional(),
    email: z
      .string()
      .email("Invalid email format")
      .max(255)
      .trim()
      .optional(),
  })
  .refine((data) => data && Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const assignRoomSchema = z.object({
  roomId: z.string().uuid("Invalid room ID"),
});

export type CreateTenantInput = z.infer<typeof createTenantSchema>;
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;
export type AssignRoomInput = z.infer<typeof assignRoomSchema>;

export interface TenantFilters {
  hasRoom?: boolean;
  roomId?: string;
  includeMovedOut?: boolean;
}

export interface Tenant {
  id: string;
  propertyId: string;
  name: string;
  phone: string;
  email: string;
  roomId: string | null;
  assignedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  movedOutAt: Date | null;
}
