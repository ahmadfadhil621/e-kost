import { NextResponse } from "next/server";
import { staffSummaryQuerySchema } from "@/domain/schemas/staff-summary";
import { withPropertyAccess } from "@/lib/property-access";
import { staffSummaryService } from "@/lib/staff-summary-service-instance";

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
  const parsed = staffSummaryQuerySchema.safeParse({
    year: searchParams.get("year"),
    month: searchParams.get("month"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    const data = await staffSummaryService.getStaffSummary(
      access.userId!,
      propertyId,
      parsed.data.year,
      parsed.data.month
    );
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
