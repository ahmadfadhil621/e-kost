import type { Room } from "@/domain/schemas/room";

export function createRoom(overrides: Partial<Room> = {}): Room {
  return {
    id: crypto.randomUUID(),
    propertyId: crypto.randomUUID(),
    roomNumber: "A101",
    roomType: "single",
    monthlyRent: 650,
    capacity: 1,
    status: "available",
    archivedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
