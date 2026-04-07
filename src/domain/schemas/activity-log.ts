import { z } from "zod";

export const ActivityActionCodeEnum = z.enum([
  "PAYMENT_RECORDED",
  "PAYMENT_UPDATED",
  "PAYMENT_DELETED",
  "EXPENSE_CREATED",
  "EXPENSE_UPDATED",
  "EXPENSE_DELETED",
  "TENANT_ASSIGNED",
  "TENANT_UNASSIGNED",
  "TENANT_MOVED",
  "TENANT_UPDATED",
  "ROOM_CREATED",
  "ROOM_UPDATED",
  "ROOM_ARCHIVED",
  "SETTINGS_STAFF_FINANCE_TOGGLED",
  "SETTINGS_PROPERTY_UPDATED",
]);

export const ActivityEntityTypeEnum = z.enum([
  "PAYMENT",
  "EXPENSE",
  "TENANT",
  "ROOM",
  "SETTINGS",
]);

export type ActivityActionCode = z.infer<typeof ActivityActionCodeEnum>;
export type ActivityEntityType = z.infer<typeof ActivityEntityTypeEnum>;

export const ENTITY_TYPE_TO_AREA: Record<ActivityEntityType, string> = {
  PAYMENT: "finance",
  EXPENSE: "finance",
  TENANT: "tenant",
  ROOM: "rooms",
  SETTINGS: "settings",
};

export const AREA_TO_ENTITY_TYPES: Record<string, ActivityEntityType[]> = {
  finance: ["PAYMENT", "EXPENSE"],
  tenant: ["TENANT"],
  rooms: ["ROOM"],
  settings: ["SETTINGS"],
};

export const logActivityInputSchema = z.object({
  propertyId: z.string().min(1),
  actorId: z.string().min(1),
  actorRole: z.string().min(1),
  actionCode: ActivityActionCodeEnum,
  entityType: ActivityEntityTypeEnum,
  entityId: z.string().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type LogActivityInput = z.infer<typeof logActivityInputSchema>;

export const activityLogEntrySchema = z.object({
  id: z.string(),
  actorId: z.string(),
  actorName: z.string(),
  actorRole: z.string(),
  actionCode: ActivityActionCodeEnum,
  entityType: ActivityEntityTypeEnum,
  entityId: z.string().nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.date(),
});

export type ActivityLogEntry = z.infer<typeof activityLogEntrySchema>;

export const activityFeedQuerySchema = z.object({
  cursor: z.string().optional(),
  area: z.enum(["finance", "tenant", "rooms", "settings"]).optional(),
  actorId: z.string().optional(),
});

export type ActivityFeedQuery = z.infer<typeof activityFeedQuerySchema>;

export interface ActivityFeedResult {
  data: ActivityLogEntry[];
  nextCursor: string | null;
}
