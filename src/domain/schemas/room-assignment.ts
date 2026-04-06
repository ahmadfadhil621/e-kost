import { z } from "zod";

export const roomAssignmentSchema = z.object({
  id: z.string(),
  tenantId: z.string(),
  roomId: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
});

export const moveTenantInputSchema = z.object({
  targetRoomId: z.string().uuid("Invalid room ID"),
  moveDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "moveDate must be YYYY-MM-DD"),
  billingDayOfMonth: z.number().int().min(1).max(31).optional(),
});

export type RoomAssignment = z.infer<typeof roomAssignmentSchema>;
export type MoveTenantInput = z.infer<typeof moveTenantInputSchema>;
