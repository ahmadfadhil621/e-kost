import type { IActivityLogRepository } from "@/domain/interfaces/activity-log-repository";
import type {
  ActivityFeedResult,
  ActivityFeedQuery,
  ActivityLogEntry,
  LogActivityInput,
} from "@/domain/schemas/activity-log";
import { AREA_TO_ENTITY_TYPES } from "@/domain/schemas/activity-log";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 20;

export class PrismaActivityLogRepository implements IActivityLogRepository {
  async create(input: LogActivityInput): Promise<void> {
    await prisma.activity_log.create({
      data: {
        propertyId: input.propertyId,
        actorId: input.actorId,
        actorRole: input.actorRole,
        actionCode: input.actionCode,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? {}) as object,
      },
    });
  }

  async findByProperty(
    propertyId: string,
    options?: Pick<ActivityFeedQuery, "cursor" | "area" | "actorId"> & {
      pageSize?: number;
    }
  ): Promise<ActivityFeedResult> {
    const take = (options?.pageSize ?? PAGE_SIZE) + 1;

    const entityTypeFilter = options?.area
      ? AREA_TO_ENTITY_TYPES[options.area]
      : undefined;

    const rows = await prisma.activity_log.findMany({
      where: {
        propertyId,
        ...(options?.actorId ? { actorId: options.actorId } : {}),
        ...(entityTypeFilter ? { entityType: { in: entityTypeFilter } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take,
      ...(options?.cursor
        ? { cursor: { id: options.cursor }, skip: 1 }
        : {}),
      include: {
        user: { select: { name: true } },
      },
    });

    const hasNextPage = rows.length === take;
    const items = hasNextPage ? rows.slice(0, -1) : rows;

    const data: ActivityLogEntry[] = items.map((row) => ({
      id: row.id,
      actorId: row.actorId,
      actorName: row.user.name,
      actorRole: row.actorRole,
      actionCode: row.actionCode,
      entityType: row.entityType,
      entityId: row.entityId ?? null,
      metadata: (row.metadata ?? {}) as Record<string, unknown>,
      createdAt: row.createdAt,
    }));

    return {
      data,
      nextCursor: hasNextPage ? items[items.length - 1].id : null,
    };
  }
}
