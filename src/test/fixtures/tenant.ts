import type { Tenant } from "@/domain/schemas/tenant";

export function createTenant(overrides: Partial<Tenant> = {}): Tenant {
  return {
    id: crypto.randomUUID(),
    propertyId: crypto.randomUUID(),
    name: "John Doe",
    phone: "081234567890",
    email: "john@example.com",
    roomId: null,
    roomNumber: null,
    assignedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    movedOutAt: null,
    ...overrides,
  };
}
