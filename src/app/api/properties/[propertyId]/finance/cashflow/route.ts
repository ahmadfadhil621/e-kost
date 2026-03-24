import { NextResponse } from "next/server";
import { cashflowQuerySchema } from "@/domain/schemas/cashflow";
import { withPropertyAccess } from "@/lib/property-access";
import { cashflowService } from "@/lib/cashflow-service-instance";

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
  const result = cashflowQuerySchema.safeParse({
    year: searchParams.get("year"),
    month: searchParams.get("month"),
  });

  if (!result.success) {
    return NextResponse.json(
      { error: "Invalid year or month" },
      { status: 400 }
    );
  }

  try {
    const entries = await cashflowService.getMonthlyCashflow(
      access.userId!,
      propertyId,
      result.data.year,
      result.data.month
    );
    return NextResponse.json(entries, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Failed to fetch cashflow" },
      { status: 500 }
    );
  }
}
