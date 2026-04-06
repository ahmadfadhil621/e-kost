import type { RoomAssignment } from "@/domain/schemas/room-assignment";
import type {
  IRoomAssignmentRepository,
  RoomAssignmentWithRoom,
} from "@/domain/interfaces/room-assignment-repository";
import { prisma } from "@/lib/prisma";

function toRoomAssignment(r: {
  id: string;
  tenantId: string;
  roomId: string;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
}): RoomAssignment {
  return {
    id: r.id,
    tenantId: r.tenantId,
    roomId: r.roomId,
    startDate: r.startDate,
    endDate: r.endDate,
    createdAt: r.createdAt,
  };
}

export class PrismaRoomAssignmentRepository
  implements IRoomAssignmentRepository
{
  async create(data: {
    tenantId: string;
    roomId: string;
    startDate: Date;
  }): Promise<RoomAssignment> {
    const created = await prisma.room_assignment.create({
      data: {
        tenantId: data.tenantId,
        roomId: data.roomId,
        startDate: data.startDate,
      },
    });
    return toRoomAssignment(created);
  }

  async closeCurrentAssignment(
    tenantId: string,
    endDate: Date
  ): Promise<RoomAssignment | null> {
    const open = await prisma.room_assignment.findFirst({
      where: { tenantId, endDate: null },
      orderBy: { startDate: "desc" },
    });
    if (!open) { return null; }
    const closed = await prisma.room_assignment.update({
      where: { id: open.id },
      data: { endDate },
    });
    return toRoomAssignment(closed);
  }

  async findByTenant(tenantId: string): Promise<RoomAssignmentWithRoom[]> {
    const rows = await prisma.room_assignment.findMany({
      where: { tenantId },
      orderBy: { startDate: "desc" },
      include: { room: { select: { roomNumber: true } } },
    });
    return rows.map((r) => ({
      ...toRoomAssignment(r),
      roomNumber: r.room.roomNumber,
    }));
  }

  async findOpenByTenant(tenantId: string): Promise<RoomAssignment | null> {
    const row = await prisma.room_assignment.findFirst({
      where: { tenantId, endDate: null },
      orderBy: { startDate: "desc" },
    });
    return row ? toRoomAssignment(row) : null;
  }
}
