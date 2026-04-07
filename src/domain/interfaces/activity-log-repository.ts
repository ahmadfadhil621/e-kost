import type {
  ActivityFeedResult,
  ActivityFeedQuery,
  LogActivityInput,
} from "@/domain/schemas/activity-log";

export interface IActivityLogRepository {
  create(input: LogActivityInput): Promise<void>;
  findByProperty(
    propertyId: string,
    options?: Pick<ActivityFeedQuery, "cursor" | "area" | "actorId"> & {
      pageSize?: number;
    }
  ): Promise<ActivityFeedResult>;
}
