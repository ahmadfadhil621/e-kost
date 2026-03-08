import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { dashboardService } from "@/lib/dashboard-service-instance";
import type { DashboardData } from "@/domain/schemas/dashboard";

function dashboardToJson(data: DashboardData) {
  return {
    occupancy: data.occupancy,
    finance: data.finance,
    outstandingBalances: data.outstandingBalances,
    outstandingCount: data.outstandingCount,
    recentPayments: data.recentPayments.map((p) => ({
      paymentId: p.paymentId,
      tenantName: p.tenantName,
      amount: p.amount,
      date: p.date instanceof Date ? p.date.toISOString() : p.date,
    })),
  };
}

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
    const data = await dashboardService.getDashboardData(
      access.userId!,
      propertyId
    );
    return NextResponse.json(dashboardToJson(data), { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
