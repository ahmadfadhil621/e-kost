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
  createdAt: Date;
  updatedAt: Date;
}): Tenant {
  return {
    id: t.id,
    propertyId: t.propertyId,
    name: t.name,
    phone: t.phone ?? "",
    email: t.email ?? "",
    roomId: t.roomId,
    assignedAt: t.roomId ? t.movedInAt : null,
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
    });
    return toTenant(created);
  }

  async findById(id: string): Promise<Tenant | null> {
    const t = await prisma.tenant.findUnique({ where: { id } });
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
    });
    return list.map(toTenant);
  }

  async update(
    id: string,
    data: Partial<{ name: string; phone: string; email: string }>
  ): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.email !== undefined && { email: data.email }),
      },
    });
    return toTenant(updated);
  }

  async assignRoom(id: string, roomId: string): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: { roomId, movedInAt: new Date() },
    });
    return toTenant(updated);
  }

  async removeRoomAssignment(id: string): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: { roomId: null },
    });
    return toTenant(updated);
  }

  async softDelete(id: string): Promise<Tenant> {
    const updated = await prisma.tenant.update({
      where: { id },
      data: { movedOutAt: new Date(), roomId: null },
    });
    return toTenant(updated);
  }
}
