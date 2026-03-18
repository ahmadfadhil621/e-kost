import type { Room, RoomStatus, RoomFilters } from "@/domain/schemas/room";

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
    filters?: RoomFilters
  ): Promise<Room[]>;
  update(
    id: string,
    data: Partial<{ roomNumber: string; roomType: string; monthlyRent: number }>
  ): Promise<Room>;
  updateStatus(id: string, status: RoomStatus): Promise<Room>;
  delete(id: string): Promise<void>;
  archive(id: string): Promise<Room>;
  unarchive(id: string): Promise<Room>;
}
