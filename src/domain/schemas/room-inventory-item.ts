import { z } from "zod";

export const ItemConditionEnum = z.enum(["NEW", "GOOD", "FAIR", "POOR", "DAMAGED"]);
export type ItemCondition = z.infer<typeof ItemConditionEnum>;

export const createInventoryItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(100, "Item name must be 100 characters or less"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(999, "Quantity must be 999 or less"),
  condition: ItemConditionEnum,
  notes: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or less")
    .optional(),
});

export const updateInventoryItemSchema = createInventoryItemSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  });

export const inventoryItemSchema = z.object({
  id: z.string(),
  roomId: z.string(),
  propertyId: z.string(),
  name: z.string(),
  quantity: z.number(),
  condition: ItemConditionEnum,
  notes: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type InventoryItem = z.infer<typeof inventoryItemSchema>;
export type CreateInventoryItemInput = z.infer<typeof createInventoryItemSchema>;
export type UpdateInventoryItemInput = z.infer<typeof updateInventoryItemSchema>;
