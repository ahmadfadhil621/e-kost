import type { IRoomRepository } from "@/domain/interfaces/room-repository";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import type {
  CreateRoomInput,
  Room,
  RoomFilters,
  UpdateRoomInput,
  RoomStatus,
} from "@/domain/schemas/room";
import type { OccupancyStats } from "@/domain/schemas/dashboard";
import {
  createRoomSchema,
  updateRoomSchema,
  updateRoomStatusSchema,
} from "@/domain/schemas/room";
import type { PropertyRole } from "@/domain/schemas/property";

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class RoomService {
  constructor(
    private readonly repo: IRoomRepository,
    private readonly tenantRepo: ITenantRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async createRoom(
    userId: string,
    propertyId: string,
    data: CreateRoomInput
  ): Promise<Room> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const parsed = createRoomSchema.parse(data);
    const existing = await this.repo.findByProperty(propertyId, { includeArchived: true });
    const duplicate = existing.some(
      (r) => r.roomNumber.toLowerCase() === parsed.roomNumber.trim().toLowerCase()
    );
    if (duplicate) {
      throw new Error("Room number already exists");
    }
    return this.repo.create({
      propertyId,
      roomNumber: parsed.roomNumber.trim(),
      roomType: parsed.roomType.trim(),
      monthlyRent: parsed.monthlyRent,
      capacity: parsed.capacity,
    });
  }

  async getRoom(userId: string, propertyId: string, id: string): Promise<Room | null> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const room = await this.repo.findById(id);
    if (!room || room.propertyId !== propertyId) {return null;}
    return room;
  }

  async listRooms(
    userId: string,
    propertyId: string,
    filters?: RoomFilters
  ): Promise<Room[]> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    return this.repo.findByProperty(propertyId, filters);
  }

  async updateRoom(
    userId: string,
    propertyId: string,
    id: string,
    data: UpdateRoomInput
  ): Promise<Room> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.repo.findById(id);
    if (!existing || existing.propertyId !== propertyId) {
      throw new Error("Room not found");
    }
    const parsed = updateRoomSchema.parse(data);
    if (parsed.roomNumber !== undefined) {
      const rooms = await this.repo.findByProperty(propertyId, { includeArchived: true });
      const duplicate = rooms.some(
        (r) =>
          r.id !== id &&
          r.roomNumber.toLowerCase() === parsed.roomNumber!.trim().toLowerCase()
      );
      if (duplicate) {throw new Error("Room number already exists");}
    }
    if (parsed.capacity !== undefined) {
      const tenants = await this.tenantRepo.findByProperty(propertyId);
      const activeInRoom = tenants.filter(
        (t) => t.roomId === id && !t.movedOutAt
      );
      if (parsed.capacity < activeInRoom.length) {
        throw new Error(
          "Cannot reduce capacity below current active tenant count"
        );
      }
    }
    return this.repo.update(id, {
      roomNumber: parsed.roomNumber?.trim(),
      roomType: parsed.roomType?.trim(),
      monthlyRent: parsed.monthlyRent,
      capacity: parsed.capacity,
    });
  }

  async updateRoomStatus(
    userId: string,
    propertyId: string,
    id: string,
    status: RoomStatus
  ): Promise<Room> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const existing = await this.repo.findById(id);
    if (!existing || existing.propertyId !== propertyId) {
      throw new Error("Room not found");
    }
    updateRoomStatusSchema.parse({ status });
    const tenants = await this.tenantRepo.findByProperty(propertyId);
    const activeInRoom = tenants.filter(
      (t) => t.roomId === id && !t.movedOutAt
    );
    if (activeInRoom.length > 0) {
      throw new Error(
        "Cannot change room status: move all active tenants out first"
      );
    }
    return this.repo.updateStatus(id, status);
  }

  async getRoomStats(userId: string, propertyId: string): Promise<OccupancyStats> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const rooms = await this.repo.findByProperty(propertyId);
    const totalRooms = rooms.length;
    let occupied = 0;
    let available = 0;
    let underRenovation = 0;
    for (const r of rooms) {
      if (r.status === "occupied") {
        occupied++;
      } else if (r.status === "available") {
        available++;
      } else if (r.status === "under_renovation") {
        underRenovation++;
      }
    }
    const occupancyRate =
      totalRooms > 0
        ? Math.round((occupied / totalRooms) * 1000) / 10
        : 0;
    return {
      totalRooms,
      occupied,
      available,
      underRenovation,
      occupancyRate,
    };
  }

  async deleteRoom(
    userId: string,
    propertyId: string,
    roomId: string
  ): Promise<void> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const room = await this.repo.findById(roomId);
    if (!room || room.propertyId !== propertyId) {
      throw new Error("Room not found");
    }
    const tenants = await this.tenantRepo.findByProperty(propertyId);
    const activeTenant = tenants.find(
      (t) => t.roomId === roomId && !t.movedOutAt
    );
    if (activeTenant) {
      throw new Error("Cannot delete room with active tenant");
    }
    await this.repo.delete(roomId);
  }

  async archiveRoom(
    userId: string,
    propertyId: string,
    roomId: string
  ): Promise<Room> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const room = await this.repo.findById(roomId);
    if (!room || room.propertyId !== propertyId) {
      throw new Error("Room not found");
    }
    if (room.archivedAt) {
      throw new Error("Room is already archived");
    }
    const tenants = await this.tenantRepo.findByProperty(propertyId);
    const activeTenant = tenants.find(
      (t) => t.roomId === roomId && !t.movedOutAt
    );
    if (activeTenant) {
      throw new Error("Cannot archive room with active tenant");
    }
    return this.repo.archive(roomId);
  }

  async unarchiveRoom(
    userId: string,
    propertyId: string,
    roomId: string
  ): Promise<Room> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const room = await this.repo.findById(roomId);
    if (!room || room.propertyId !== propertyId) {
      throw new Error("Room not found");
    }
    if (!room.archivedAt) {
      throw new Error("Room is not archived");
    }
    return this.repo.unarchive(roomId);
  }
}
