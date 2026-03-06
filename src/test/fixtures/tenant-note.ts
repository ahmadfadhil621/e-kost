import type { TenantNote } from "@/domain/schemas/tenant-note";

export function createTenantNote(overrides: Partial<TenantNote> = {}): TenantNote {
  return {
    id: crypto.randomUUID(),
    tenantId: crypto.randomUUID(),
    content: "Agreed to fix the window by Friday.",
    date: new Date("2025-03-01"),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
