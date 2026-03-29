import type { Property, PropertyStaff } from "@/domain/schemas/property";
import type { IPropertyRepository } from "@/domain/interfaces/property-repository";
import { prisma } from "@/lib/prisma";

function toProperty(p: {
  id: string;
  name: string;
  address: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  archivedAt?: Date | null;
}): Property {
  return {
    id: p.id,
    name: p.name,
    address: p.address ?? "",
    ownerId: p.ownerId,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    deletedAt: p.deletedAt,
    archivedAt: p.archivedAt ?? null,
  };
}

function toPropertyStaff(p: {
  id: string;
  propertyId: string;
  userId: string;
  createdAt: Date;
  user: { id: string; name: string; email: string };
}): PropertyStaff {
  return {
    id: p.id,
    propertyId: p.propertyId,
    userId: p.userId,
    user: p.user,
    assignedAt: p.createdAt,
  };
}

export class PrismaPropertyRepository implements IPropertyRepository {
  async create(data: {
    name: string;
    address: string;
    ownerId: string;
  }): Promise<Property> {
    const created = await prisma.property.create({
      data: {
        name: data.name,
        address: data.address || null,
        ownerId: data.ownerId,
      },
    });
    return toProperty(created);
  }

  async findById(id: string): Promise<Property | null> {
    const p = await prisma.property.findUnique({
      where: { id },
    });
    return p ? toProperty(p) : null;
  }

  async findByUser(userId: string): Promise<Property[]> {
    const list = await prisma.property.findMany({
      where: {
        deletedAt: null,
        archivedAt: null,
        OR: [
          { ownerId: userId },
          { staff: { some: { userId } } },
        ],
      },
      orderBy: { name: "asc" },
    });
    return list.map(toProperty);
  }

  async update(
    id: string,
    data: Partial<{ name: string; address: string }>
  ): Promise<Property> {
    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.address !== undefined && { address: data.address }),
      },
    });
    return toProperty(updated);
  }

  async softDelete(id: string): Promise<void> {
    await prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async archive(id: string): Promise<Property> {
    const updated = await prisma.property.update({
      where: { id },
      data: { archivedAt: new Date() },
    });
    return toProperty(updated);
  }

  async unarchive(id: string): Promise<Property> {
    const updated = await prisma.property.update({
      where: { id },
      data: { archivedAt: null },
    });
    return toProperty(updated);
  }

  async hardDelete(id: string): Promise<void> {
    await prisma.property.delete({ where: { id } });
  }

  async addStaff(propertyId: string, userId: string): Promise<PropertyStaff> {
    const created = await prisma.propertyStaff.create({
      data: { propertyId, userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return toPropertyStaff(created);
  }

  async removeStaff(propertyId: string, userId: string): Promise<void> {
    await prisma.propertyStaff.deleteMany({
      where: { propertyId, userId },
    });
  }

  async findStaff(propertyId: string): Promise<PropertyStaff[]> {
    const list = await prisma.propertyStaff.findMany({
      where: { propertyId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });
    return list.map(toPropertyStaff);
  }

  async findUserRole(
    propertyId: string,
    userId: string
  ): Promise<"owner" | "staff" | null> {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true, deletedAt: true, archivedAt: true },
    });
    if (!property || property.deletedAt) {return null;}
    if (property.ownerId === userId) {return "owner";}
    const staff = await prisma.propertyStaff.findUnique({
      where: { propertyId_userId: { propertyId, userId } },
    });
    return staff ? "staff" : null;
  }
}
