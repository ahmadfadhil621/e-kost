import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { tenantService } from "@/lib/tenant-service-instance";
import { moveTenantInputSchema } from "@/domain/schemas/room-assignment";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string; tenantId: string }> }
) {
  const { propertyId, tenantId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = moveTenantInputSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      { error: firstIssue?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { targetRoomId, moveDate, billingDayOfMonth } = parsed.data;

  try {
    const tenant = await tenantService.moveTenantToRoom(
      access.userId!,
      propertyId,
      tenantId,
      { targetRoomId, moveDate, billingDayOfMonth }
    );
    return NextResponse.json({
      data: {
        id: tenant.id,
        propertyId: tenant.propertyId,
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email,
        roomId: tenant.roomId,
        roomNumber: tenant.roomNumber,
        assignedAt: tenant.assignedAt,
        billingDayOfMonth: tenant.billingDayOfMonth,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        movedOutAt: tenant.movedOutAt,
      },
    });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === "Tenant not found") {
        return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
      }
      if (err.message === "Room not found") {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }
      if (err.message === "Room is at capacity") {
        return NextResponse.json({ error: "Room is at capacity" }, { status: 409 });
      }
      if (err.message.includes("same room")) {
        return NextResponse.json({ error: "Cannot move to same room" }, { status: 400 });
      }
      if (err.message.includes("inactive") || err.message.includes("moved out")) {
        return NextResponse.json({ error: "Tenant is inactive" }, { status: 400 });
      }
    }
    console.error("[move route] unexpected error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
