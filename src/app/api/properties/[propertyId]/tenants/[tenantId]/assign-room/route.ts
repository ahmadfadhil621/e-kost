import { NextResponse } from "next/server";
import { z } from "zod";
import { assignRoomSchema } from "@/domain/schemas/tenant";
import { withPropertyAccess } from "@/lib/property-access";
import { tenantService } from "@/lib/tenant-service-instance";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string; tenantId: string }> }
) {
  const { propertyId, tenantId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) return access.errorResponse;

  try {
    const body = await request.json();
    const { roomId } = assignRoomSchema.parse(body);
    const tenant = await tenantService.assignRoom(
      access.userId!,
      propertyId,
      tenantId,
      roomId
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
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Tenant not found") {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "Room not found") {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (
      err instanceof Error &&
      (err.message.includes("already occupied") ||
        err.message.includes("already assigned"))
    ) {
      return NextResponse.json(
        { error: err.message },
        { status: 409 }
      );
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
