import type { Room, RoomStatus } from "@/domain/schemas/room";

export interface IRoomRepository {
  create(data: {
    propertyId: string;
    roomNumber: string;
    roomType: string;
    monthlyRent: number;
  }): Promise<Room>;
  findById(id: string): Promise<Room | null>;
  findByProperty(
    propertyId: string,
    filters?: { status?: RoomStatus }
  ): Promise<Room[]>;
  update(
    id: string,
    data: Partial<{ roomNumber: string; roomType: string; monthlyRent: number }>
  ): Promise<Room>;
  updateStatus(id: string, status: RoomStatus): Promise<Room>;
}
