import type { Room, RoomStatus } from "@/domain/schemas/room";
import type { IRoomRepository } from "@/domain/interfaces/room-repository";
import { prisma } from "@/lib/prisma";

const DOMAIN_TO_PRISMA: Record<RoomStatus, "AVAILABLE" | "OCCUPIED" | "RENOVATION"> = {
  available: "AVAILABLE",
  occupied: "OCCUPIED",
  under_renovation: "RENOVATION",
};

const PRISMA_TO_DOMAIN: Record<string, RoomStatus> = {
  AVAILABLE: "available",
  OCCUPIED: "occupied",
  RENOVATION: "under_renovation",
};

function toDomainStatus(s: string): RoomStatus {
  const status = PRISMA_TO_DOMAIN[s];
  if (!status) {throw new Error(`Unknown room status: ${s}`);}
  return status;
}

function toNumber(value: unknown): number {
  if (value === null || value === undefined) {return 0;}
  if (typeof value === "number" && !Number.isNaN(value)) {return value;}
  if (typeof value === "object" && "toNumber" in value && typeof (value as { toNumber: () => number }).toNumber === "function") {
    return (value as { toNumber: () => number }).toNumber();
  }
  const n = Number(value);
  return Number.isNaN(n) ? 0 : n;
}

function toRoom(r: {
  id: string;
  propertyId: string;
  roomNumber: string;
  roomType: string | null;
  monthlyRent: unknown;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): Room {
  return {
    id: r.id,
    propertyId: r.propertyId,
    roomNumber: r.roomNumber,
    roomType: r.roomType ?? "",
    monthlyRent: toNumber(r.monthlyRent),
    status: toDomainStatus(r.status),
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

export class PrismaRoomRepository implements IRoomRepository {
  async create(data: {
    propertyId: string;
    roomNumber: string;
    roomType: string;
    monthlyRent: number;
  }): Promise<Room> {
    try {
      const created = await prisma.room.create({
        data: {
          propertyId: data.propertyId,
          roomNumber: data.roomNumber,
          roomType: data.roomType,
          monthlyRent: data.monthlyRent,
          status: "AVAILABLE",
        },
      });
      return toRoom(created);
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      if (prismaErr.code === "P2002") {
        throw new Error("Room number already exists");
      }
      throw err;
    }
  }

  async findById(id: string): Promise<Room | null> {
    const r = await prisma.room.findUnique({ where: { id } });
    return r ? toRoom(r) : null;
  }

  async findByProperty(
    propertyId: string,
    filters?: { status?: RoomStatus }
  ): Promise<Room[]> {
    const list = await prisma.room.findMany({
      where: {
        propertyId,
        ...(filters?.status && {
          status: DOMAIN_TO_PRISMA[filters.status],
        }),
      },
      orderBy: [{ roomNumber: "asc" }],
    });
    return list.map(toRoom);
  }

  async update(
    id: string,
    data: Partial<{
      roomNumber: string;
      roomType: string;
      monthlyRent: number;
    }>
  ): Promise<Room> {
    try {
      const updated = await prisma.room.update({
        where: { id },
        data: {
          ...(data.roomNumber !== undefined && { roomNumber: data.roomNumber }),
          ...(data.roomType !== undefined && { roomType: data.roomType }),
          ...(data.monthlyRent !== undefined && { monthlyRent: data.monthlyRent }),
        },
      });
      return toRoom(updated);
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      if (prismaErr.code === "P2002") {
        throw new Error("Room number already exists");
      }
      throw err;
    }
  }

  async updateStatus(id: string, status: RoomStatus): Promise<Room> {
    const updated = await prisma.room.update({
      where: { id },
      data: { status: DOMAIN_TO_PRISMA[status] },
    });
    return toRoom(updated);
  }
}
