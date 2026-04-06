import type { Property, PropertyStaff } from "@/domain/schemas/property";

export function createProperty(overrides: Partial<Property> = {}): Property {
  return {
    id: crypto.randomUUID(),
    name: "Test Property",
    address: "123 Test Street",
    currency: "EUR",
    ownerId: crypto.randomUUID(),
    staffOnlyFinance: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    archivedAt: null,
    ...overrides,
  };
}

export function createPropertyStaff(
  overrides: Partial<PropertyStaff> = {}
): PropertyStaff {
  return {
    id: crypto.randomUUID(),
    propertyId: crypto.randomUUID(),
    userId: crypto.randomUUID(),
    user: {
      id: crypto.randomUUID(),
      name: "Staff User",
      email: "staff@example.com",
    },
    assignedAt: new Date(),
    ...overrides,
  };
}
