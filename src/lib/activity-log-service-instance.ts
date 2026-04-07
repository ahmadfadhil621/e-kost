import { ActivityLogService } from "@/lib/activity-log-service";
import { activityLogRepo } from "@/lib/activity-log-singleton";
import { propertyService } from "@/lib/property-service-instance";

export const activityLogService = new ActivityLogService(
  activityLogRepo,
  propertyService
);
