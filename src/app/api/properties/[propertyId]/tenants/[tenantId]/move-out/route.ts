import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { tenantService } from "@/lib/tenant-service-instance";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string; tenantId: string }> }
) {
  const { propertyId, tenantId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const tenant = await tenantService.moveOut(
      access.userId!,
      propertyId,
      tenantId
    );
    return NextResponse.json({
      id: tenant.id,
      propertyId: tenant.propertyId,
      name: tenant.name,
      phone: tenant.phone,
      email: tenant.email,
      roomId: tenant.roomId,
      assignedAt: tenant.assignedAt,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      movedOutAt: tenant.movedOutAt,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Tenant not found") {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
