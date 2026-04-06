import type { RoomAssignmentWithRoom } from "@/domain/interfaces/room-assignment-repository";

export function createRoomAssignment(
  overrides: Partial<RoomAssignmentWithRoom> = {}
): RoomAssignmentWithRoom {
  return {
    id: crypto.randomUUID(),
    tenantId: crypto.randomUUID(),
    roomId: crypto.randomUUID(),
    startDate: new Date("2026-01-15T00:00:00.000Z"),
    endDate: null,
    createdAt: new Date("2026-01-15T00:00:00.000Z"),
    roomNumber: "101",
    ...overrides,
  };
}
