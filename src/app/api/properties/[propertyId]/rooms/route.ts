import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoomSchema } from "@/domain/schemas/room";
import { withPropertyAccess } from "@/lib/property-access";
import { roomService } from "@/lib/room-service-instance";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const body = await request.json();
    const data = createRoomSchema.parse(body);
    const room = await roomService.createRoom(
      access.userId!,
      propertyId,
      data
    );
    return NextResponse.json(
      {
        id: room.id,
        propertyId: room.propertyId,
        roomNumber: room.roomNumber,
        roomType: room.roomType,
        monthlyRent: room.monthlyRent,
        status: room.status,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
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

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const filters =
      status && ["available", "occupied", "under_renovation"].includes(status)
        ? { status: status as "available" | "occupied" | "under_renovation" }
        : undefined;
    const rooms = await roomService.listRooms(access.userId!, propertyId, filters);
    return NextResponse.json({ rooms, count: rooms.length });
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
