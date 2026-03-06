import type { TenantNote } from "@/domain/schemas/tenant-note";

export interface INoteRepository {
  create(data: { tenantId: string; content: string; date: Date }): Promise<TenantNote>;
  findByTenant(tenantId: string): Promise<TenantNote[]>;
  findById(id: string): Promise<TenantNote | null>;
  update(id: string, data: Partial<{ content: string; date: Date }>): Promise<TenantNote>;
  delete(id: string): Promise<void>;
}
