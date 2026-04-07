import type { ActivityLogEntry, LogActivityInput } from "@/domain/schemas/activity-log";

export function createActivityLogEntry(
  overrides: Partial<ActivityLogEntry> = {}
): ActivityLogEntry {
  return {
    id: crypto.randomUUID(),
    actorId: crypto.randomUUID(),
    actorName: "Ahmad Fadhil",
    actorRole: "owner",
    actionCode: "PAYMENT_RECORDED",
    entityType: "PAYMENT",
    entityId: crypto.randomUUID(),
    metadata: { amount: 500000, tenantName: "Siti", roomName: "3A" },
    createdAt: new Date("2026-04-07T12:00:00.000Z"),
    ...overrides,
  };
}

export function createLogActivityInput(
  overrides: Partial<LogActivityInput> = {}
): LogActivityInput {
  return {
    propertyId: crypto.randomUUID(),
    actorId: crypto.randomUUID(),
    actorRole: "owner",
    actionCode: "PAYMENT_RECORDED",
    entityType: "PAYMENT",
    entityId: crypto.randomUUID(),
    metadata: { amount: 500000, tenantName: "Siti", roomName: "3A" },
    ...overrides,
  };
}
