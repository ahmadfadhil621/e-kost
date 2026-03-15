import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { balanceService } from "@/lib/balance-service-instance";

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string; tenantId: string }> }
) {
  const { propertyId, tenantId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    const result = await balanceService.calculateBalance(
      access.userId!,
      propertyId,
      tenantId
    );
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (
        err.message.includes("not found") ||
        err.message.includes("no room assignment") ||
        err.message.includes("Cannot calculate balance")
      ) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
