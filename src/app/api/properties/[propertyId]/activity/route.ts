import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { activityLogService } from "@/lib/activity-log-service-instance";
import { activityFeedQuerySchema } from "@/domain/schemas/activity-log";

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const parseResult = activityFeedQuerySchema.safeParse({
    cursor: searchParams.get("cursor") ?? undefined,
    area: searchParams.get("area") ?? undefined,
    actorId: searchParams.get("actorId") ?? undefined,
  });

  if (!parseResult.success) {
    return NextResponse.json(
      { errors: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const result = await activityLogService.getActivityFeed(
      access.userId!,
      propertyId,
      parseResult.data
    );

    return NextResponse.json({
      data: result.data.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt.toISOString(),
      })),
      nextCursor: result.nextCursor,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
