import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { tenantService } from "@/lib/tenant-service-instance";

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string; tenantId: string }> }
) {
  const { propertyId, tenantId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const assignments = await tenantService.getRoomAssignments(
      access.userId!,
      propertyId,
      tenantId
    );
    return NextResponse.json({
      data: assignments.map((a) => ({
        id: a.id,
        tenantId: a.tenantId,
        roomId: a.roomId,
        roomNumber: a.roomNumber,
        startDate: a.startDate,
        endDate: a.endDate,
        createdAt: a.createdAt,
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Tenant not found") {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
