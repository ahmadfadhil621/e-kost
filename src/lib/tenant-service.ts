import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";
import type {
  Tenant,
  CreateTenantInput,
  UpdateTenantInput,
  TenantFilters,
} from "@/domain/schemas/tenant";
import {
  createTenantSchema,
  updateTenantSchema,
  assignRoomSchema,
} from "@/domain/schemas/tenant";
import type { PropertyRole } from "@/domain/schemas/property";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class TenantService {
  constructor(
    private readonly tenantRepo: ITenantRepository,
    private readonly roomRepo: IRoomRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async createTenant(
    userId: string,
    propertyId: string,
    data: CreateTenantInput
  ): Promise<Tenant> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const parsed = createTenantSchema.parse(data);
    return this.tenantRepo.create({
      propertyId,
      name: parsed.name.trim(),
      phone: parsed.phone.trim(),
      email: parsed.email.trim(),
    });
  }

  async getTenant(
    userId: string,
    propertyId: string,
    id: string
  ): Promise<Tenant | null> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const tenant = await this.tenantRepo.findById(id);
    if (!tenant || tenant.propertyId !== propertyId) {return null;}
    return tenant;
  }

  async listTenants(
    userId: string,
    propertyId: string,
    filters?: TenantFilters
  ): Promise<Tenant[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const includeMovedOut = filters?.includeMovedOut ?? false;
    return this.tenantRepo.findByProperty(propertyId, { includeMovedOut });
  }

  async updateTenant(
    userId: string,
    propertyId: string,
    id: string,
    data: UpdateTenantInput
  ): Promise<Tenant> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.tenantRepo.findById(id);
    if (!existing || existing.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    if (existing.movedOutAt) {
      throw new Error("Cannot update moved-out tenant");
    }
    const parsed = updateTenantSchema.parse(data);
    const updates: Partial<{ name: string; phone: string; email: string }> = {};
    if (parsed.name !== undefined) {updates.name = parsed.name.trim();}
    if (parsed.phone !== undefined) {updates.phone = parsed.phone.trim();}
    if (parsed.email !== undefined) {updates.email = parsed.email.trim();}
    return this.tenantRepo.update(id, updates);
  }

  async assignRoom(
    userId: string,
    propertyId: string,
    tenantId: string,
    roomId: string
  ): Promise<Tenant> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    assignRoomSchema.parse({ roomId });

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    if (tenant.movedOutAt) {
      throw new Error("Cannot assign room to moved-out tenant");
    }
    if (tenant.roomId) {
      throw new Error("Tenant is already assigned to a room");
    }

    const room = await this.roomRepo.findById(roomId);
    if (!room || room.propertyId !== propertyId) {
      throw new Error("Room not found");
    }
    if (room.status === "under_renovation") {
      throw new Error("Room is under renovation");
    }

    const allTenants = await this.tenantRepo.findByProperty(propertyId);
    const activeInRoom = allTenants.filter(
      (t) => t.roomId === roomId && !t.movedOutAt
    );
    if (activeInRoom.length >= room.capacity) {
      throw new Error("Room is at full capacity");
    }

    const updated = await this.tenantRepo.assignRoom(tenantId, roomId);
    if (room.status === "available") {
      await this.roomRepo.updateStatus(roomId, "occupied");
    }
    return updated;
  }

  async moveOut(
    userId: string,
    propertyId: string,
    tenantId: string
  ): Promise<Tenant> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    if (tenant.movedOutAt) {
      throw new Error("Tenant is already moved out");
    }

    if (tenant.roomId) {
      await this.tenantRepo.removeRoomAssignment(tenantId);
      const remaining = await this.tenantRepo.findByProperty(propertyId);
      const stillInRoom = remaining.filter(
        (t) => t.roomId === tenant.roomId && !t.movedOutAt && t.id !== tenantId
      );
      if (stillInRoom.length === 0) {
        await this.roomRepo.updateStatus(tenant.roomId, "available");
      }
    }
    return this.tenantRepo.softDelete(tenantId);
  }
}
