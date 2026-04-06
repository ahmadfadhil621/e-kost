import type { RoomAssignment } from "@/domain/schemas/room-assignment";

export interface RoomAssignmentWithRoom extends RoomAssignment {
  roomNumber: string;
}

export interface IRoomAssignmentRepository {
  create(data: {
    tenantId: string;
    roomId: string;
    startDate: Date;
  }): Promise<RoomAssignment>;
  closeCurrentAssignment(
    tenantId: string,
    endDate: Date
  ): Promise<RoomAssignment | null>;
  findByTenant(tenantId: string): Promise<RoomAssignmentWithRoom[]>;
  findOpenByTenant(tenantId: string): Promise<RoomAssignment | null>;
}
