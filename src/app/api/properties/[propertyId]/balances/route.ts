import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { balanceService } from "@/lib/balance-service-instance";

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as "paid" | "unpaid" | null;
    const filter =
      status === "paid" || status === "unpaid" ? status : undefined;
    const result = await balanceService.calculateBalances(
      access.userId!,
      propertyId,
      filter
    );
    return NextResponse.json({ balances: result }, { status: 200 });
  } catch (err) {
    if (err instanceof Error && err.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
