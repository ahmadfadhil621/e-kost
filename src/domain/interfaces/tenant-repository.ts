import type { Tenant } from "@/domain/schemas/tenant";

export interface ITenantRepository {
  create(data: {
    propertyId: string;
    name: string;
    phone: string;
    email: string;
  }): Promise<Tenant>;
  findById(id: string): Promise<Tenant | null>;
  findByProperty(
    propertyId: string,
    filters?: { includeMovedOut?: boolean }
  ): Promise<Tenant[]>;
  update(
    id: string,
    data: Partial<{ name: string; phone: string; email: string }>
  ): Promise<Tenant>;
  assignRoom(id: string, roomId: string): Promise<Tenant>;
  removeRoomAssignment(id: string): Promise<Tenant>;
  softDelete(id: string): Promise<Tenant>;
}
