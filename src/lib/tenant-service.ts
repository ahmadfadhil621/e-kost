import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";
import type { IRoomAssignmentRepository, RoomAssignmentWithRoom } from "@/domain/interfaces/room-assignment-repository";
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
    private readonly propertyAccess: IPropertyAccessValidator,
    private readonly roomAssignmentRepo?: IRoomAssignmentRepository
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
    const updates: Partial<{ name: string; phone: string; email: string; billingDayOfMonth: number | null }> = {};
    if (parsed.name !== undefined) {updates.name = parsed.name.trim();}
    if (parsed.phone !== undefined) {updates.phone = parsed.phone.trim();}
    if (parsed.email !== undefined) {updates.email = parsed.email.trim();}
    if ("billingDayOfMonth" in parsed) {updates.billingDayOfMonth = parsed.billingDayOfMonth ?? null;}
    return this.tenantRepo.update(id, updates);
  }

  async assignRoom(
    userId: string,
    propertyId: string,
    tenantId: string,
    roomId: string,
    billingDayOfMonth?: number
  ): Promise<Tenant> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    assignRoomSchema.parse({ roomId, billingDayOfMonth });

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

    const effectiveDay = billingDayOfMonth ?? new Date().getDate();
    const updated = await this.tenantRepo.assignRoom(tenantId, roomId, effectiveDay);
    if (room.status === "available") {
      await this.roomRepo.updateStatus(roomId, "occupied");
    }
    return updated;
  }

  async moveTenantToRoom(
    userId: string,
    propertyId: string,
    tenantId: string,
    input: { targetRoomId: string; moveDate: string; billingDayOfMonth?: number }
  ): Promise<Tenant> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }
    if (tenant.movedOutAt) {
      throw new Error("Tenant is inactive (moved out)");
    }
    if (tenant.roomId && tenant.roomId === input.targetRoomId) {
      throw new Error("Cannot move to same room");
    }

    const targetRoom = await this.roomRepo.findById(input.targetRoomId);
    if (!targetRoom || targetRoom.propertyId !== propertyId) {
      throw new Error("Room not found");
    }

    const allTenants = await this.tenantRepo.findByProperty(propertyId);
    const activeInTarget = allTenants.filter(
      (t) => t.roomId === input.targetRoomId && !t.movedOutAt
    );
    if (activeInTarget.length >= targetRoom.capacity) {
      throw new Error("Room is at capacity");
    }

    const moveDate = new Date(input.moveDate);
    const oldRoomId = tenant.roomId;

    if (oldRoomId && this.roomAssignmentRepo) {
      await this.roomAssignmentRepo.closeCurrentAssignment(tenantId, moveDate);
    }

    if (this.roomAssignmentRepo) {
      await this.roomAssignmentRepo.create({
        tenantId,
        roomId: input.targetRoomId,
        startDate: moveDate,
      });
    }

    const moveData: { roomId: string; movedInAt: Date; billingDayOfMonth?: number } = {
      roomId: input.targetRoomId,
      movedInAt: moveDate,
    };
    if (input.billingDayOfMonth !== undefined) {
      moveData.billingDayOfMonth = input.billingDayOfMonth;
    }
    const updated = await this.tenantRepo.moveRoom(tenantId, moveData);

    await this.roomRepo.updateStatus(input.targetRoomId, "occupied");

    if (oldRoomId) {
      const remaining = allTenants.filter(
        (t) => t.roomId === oldRoomId && !t.movedOutAt && t.id !== tenantId
      );
      if (remaining.length === 0) {
        await this.roomRepo.updateStatus(oldRoomId, "available");
      }
    }

    return updated;
  }

  async getRoomAssignments(
    userId: string,
    propertyId: string,
    tenantId: string
  ): Promise<RoomAssignmentWithRoom[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);

    const tenant = await this.tenantRepo.findById(tenantId);
    if (!tenant || tenant.propertyId !== propertyId) {
      throw new Error("Tenant not found");
    }

    if (!this.roomAssignmentRepo) {
      return [];
    }
    return this.roomAssignmentRepo.findByTenant(tenantId);
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
