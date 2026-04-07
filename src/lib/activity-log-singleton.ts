import { PrismaActivityLogRepository } from "@/lib/repositories/prisma/prisma-activity-log-repository";
import { makeLogActivity } from "@/lib/activity-log-service";

const activityLogRepo = new PrismaActivityLogRepository();

export { activityLogRepo };
export const logActivity = makeLogActivity(activityLogRepo);
