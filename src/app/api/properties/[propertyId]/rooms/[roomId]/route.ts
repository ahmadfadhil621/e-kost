import { NextResponse } from "next/server";
import { z } from "zod";
import { updateRoomSchema } from "@/domain/schemas/room";
import { withPropertyAccess } from "@/lib/property-access";
import { roomService } from "@/lib/room-service-instance";
import { tenantService } from "@/lib/tenant-service-instance";

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string; roomId: string }> }
) {
  const { propertyId, roomId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const room = await roomService.getRoom(
      access.userId!,
      propertyId,
      roomId
    );
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    const base = {
      id: room.id,
      propertyId: room.propertyId,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      monthlyRent: room.monthlyRent,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    };
    if (room.status === "occupied") {
      const tenants = await tenantService.listTenants(
        access.userId!,
        propertyId
      );
      const tenant = tenants.find(
        (t) => t.roomId === room.id && !t.movedOutAt
      );
      if (tenant) {
        return NextResponse.json({
          ...base,
          tenantId: tenant.id,
          tenantName: tenant.name,
        });
      }
    }
    return NextResponse.json(base);
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

export async function PUT(
  request: Request,
  context: { params: Promise<{ propertyId: string; roomId: string }> }
) {
  const { propertyId, roomId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const body = await request.json();
    const data = updateRoomSchema.parse(body);
    const room = await roomService.updateRoom(
      access.userId!,
      propertyId,
      roomId,
      data
    );
    return NextResponse.json({
      id: room.id,
      propertyId: room.propertyId,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      monthlyRent: room.monthlyRent,
      status: room.status,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Room not found") {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "Room number already exists") {
      return NextResponse.json(
        { error: "Room number already exists" },
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
