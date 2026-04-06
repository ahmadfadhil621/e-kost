import type { Tenant } from "@/domain/schemas/tenant";
import type { ITenantRepository } from "@/domain/interfaces/tenant-repository";
import { prisma } from "@/lib/prisma";

function toTenant(t: {
  id: string;
  propertyId: string;
  name: string;
  phone: string | null;
  email: string | null;
  roomId: string | null;
  movedInAt: Date;
  movedOutAt: Date | null;
  billingDayOfMonth: number | null;
  createdAt: Date;
  updatedAt: Date;
  room?: { roomNumber: string } | null;
}): Tenant {
  return {
    id: t.id,
    propertyId: t.propertyId,
    name: t.name,
    phone: t.phone ?? "",
    email: t.email ?? "",
    roomId: t.roomId,
    roomNumber: t.room?.roomNumber ?? null,
    assignedAt: t.roomId ? t.movedInAt : null,
    billingDayOfMonth: t.billingDayOfMonth,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
    movedOutAt: t.movedOutAt,
  };
}

export class PrismaTenantRepository implements ITenantRepository {
  async create(data: {
    propertyId: string;
    name: string;
    phone: string;
    email: string;
  }): Promise<Tenant> {
    const created = await prisma.tenant.create({
      data: {
        propertyId: data.propertyId,
        name: data.name,
        phone: data.phone,
        email: data.email,
      },
      include: { room: { select: { roomNumber: true } } },
    });
    return toTenant(created);
  }

  async findById(id: string): Promise<Tenant | null> {
    const t = await prisma.tenant.findUnique({
      where: { id },
      include: { room: { select: { roomNumber: true } } },
    });
    return t ? toTenant(t) : null;
  }

  async findByProperty(
    propertyId: string,
    filters?: { includeMovedOut?: boolean }
  ): Promise<Tenant[]> {
    const list = await prisma.tenant.findMany({
      where: {
        propertyId,
        ...(filters?.includeMovedOut === true
          ? {}
          : { movedOutAt: null }),
      },
      orderBy: [{ name: "asc" }],
      include: { room: { select: { roomNumber: true } } },
    });
    return list.map(toTenant);
  }

  async update(
    id: string,
    data: Partial<{ name: string; phone: string; email: string; billingDayOfMonth: number | null }>
  ): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
        ...("billingDayOfMonth" in data && { billingDayOfMonth: data.billingDayOfMonth }),
      },
      include: { room: { select: { roomNumber: true } } },
    });
    return toTenant(updated);
  }

  async moveRoom(
    id: string,
    data: { roomId: string; movedInAt: Date; billingDayOfMonth?: number }
  ): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        roomId: data.roomId,
        movedInAt: data.movedInAt,
        ...(data.billingDayOfMonth !== undefined && {
          billingDayOfMonth: data.billingDayOfMonth,
        }),
      },
      include: { room: { select: { roomNumber: true } } },
    });
    return toTenant(updated);
  }

  async assignRoom(id: string, roomId: string, billingDayOfMonth: number): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: { roomId, movedInAt: new Date(), billingDayOfMonth },
      include: { room: { select: { roomNumber: true } } },
    });
    return toTenant(updated);
  }

  async removeRoomAssignment(id: string): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: { roomId: null },
      include: { room: { select: { roomNumber: true } } },
    });
    return toTenant(updated);
  }

  async softDelete(id: string): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: { movedOutAt: new Date(), roomId: null },
      include: { room: { select: { roomNumber: true } } },
    });
    return toTenant(updated);
  }
}
