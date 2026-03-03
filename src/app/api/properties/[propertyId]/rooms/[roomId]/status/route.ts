import { NextResponse } from "next/server";
import { z } from "zod";
import { updateRoomStatusSchema } from "@/domain/schemas/room";
import { withPropertyAccess } from "@/lib/property-access";
import { roomService } from "@/lib/room-service-instance";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ propertyId: string; roomId: string }> }
) {
  const { propertyId, roomId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) return access.errorResponse;

  try {
    const body = await request.json();
    const { status } = updateRoomStatusSchema.parse(body);
    const room = await roomService.updateRoomStatus(
      access.userId!,
      propertyId,
      roomId,
      status
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
    if (err instanceof Error && err.message.includes("Forbidden")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
