import type { IActivityLogRepository } from "@/domain/interfaces/activity-log-repository";
import type {
  ActivityFeedQuery,
  ActivityFeedResult,
  LogActivityInput,
} from "@/domain/schemas/activity-log";
import type { PropertyRole } from "@/domain/schemas/property";

export type LogActivityFn = (input: LogActivityInput) => void;

export interface IPropertyAccessValidator {
  validateAccess(userId: string, propertyId: string): Promise<PropertyRole>;
}

export class ActivityLogService {
  constructor(
    private readonly repo: IActivityLogRepository,
    private readonly propertyAccess: IPropertyAccessValidator
  ) {}

  async getActivityFeed(
    userId: string,
    propertyId: string,
    query?: ActivityFeedQuery
  ): Promise<ActivityFeedResult> {
    await this.propertyAccess.validateAccess(userId, propertyId);
    return this.repo.findByProperty(propertyId, {
      cursor: query?.cursor,
      area: query?.area,
      actorId: query?.actorId,
    });
  }
}

/**
 * Fire-and-forget helper. Errors are swallowed so logging never blocks primary actions.
 * The `repo` parameter is injected to keep this testable.
 */
export function makeLogActivity(repo: IActivityLogRepository): LogActivityFn {
  return (input: LogActivityInput): void => {
    repo.create(input).catch(() => {
      // Intentionally swallow — logging must never break a primary action
    });
  };
}
