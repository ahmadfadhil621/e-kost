import type { TenantNote } from "@/domain/schemas/tenant-note";
import type { INoteRepository } from "@/domain/interfaces/note-repository";
import { prisma } from "@/lib/prisma";

function toNote(n: {
  id: string;
  tenantId: string;
  content: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}): TenantNote {
  return {
    id: n.id,
    tenantId: n.tenantId,
    content: n.content,
    date: n.date,
    createdAt: n.createdAt,
    updatedAt: n.updatedAt,
  };
}

export class PrismaNoteRepository implements INoteRepository {
  async create(data: {
    tenantId: string;
    content: string;
    date: Date;
  }): Promise<TenantNote> {
    const created = await prisma.tenantNote.create({
      data: {
        tenantId: data.tenantId,
        content: data.content,
        date: data.date,
      },
    });
    return toNote(created);
  }

  async findByTenant(tenantId: string): Promise<TenantNote[]> {
    const list = await prisma.tenantNote.findMany({
      where: { tenantId },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    });
    return list.map(toNote);
  }

  async findById(id: string): Promise<TenantNote | null> {
    const n = await prisma.tenantNote.findUnique({
      where: { id },
    });
    return n ? toNote(n) : null;
  }

  async update(
    id: string,
    data: Partial<{ content: string; date: Date }>
  ): Promise<TenantNote> {
    const updated = await prisma.tenantNote.update({
      where: { id },
      data: {
        ...(data.content !== undefined && { content: data.content }),
        ...(data.date !== undefined && { date: data.date }),
      },
    });
    return toNote(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.tenantNote.delete({
      where: { id },
    });
  }
}
