import type { IRoomRepository } from "@/domain/interfaces/room-repository";
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
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async createRoom(
    userId: string,
    propertyId: string,
    data: CreateRoomInput
  ): Promise<Room> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    const parsed = createRoomSchema.parse(data);
    const existing = await this.repo.findByProperty(propertyId);
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
      const rooms = await this.repo.findByProperty(propertyId);
      const duplicate = rooms.some(
        (r) =>
          r.id !== id &&
          r.roomNumber.toLowerCase() === parsed.roomNumber!.trim().toLowerCase()
      );
      if (duplicate) {throw new Error("Room number already exists");}
    }
    return this.repo.update(id, {
      roomNumber: parsed.roomNumber?.trim(),
      roomType: parsed.roomType?.trim(),
      monthlyRent: parsed.monthlyRent,
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
}
