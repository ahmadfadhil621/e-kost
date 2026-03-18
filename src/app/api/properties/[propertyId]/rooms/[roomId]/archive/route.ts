import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { roomService } from "@/lib/room-service-instance";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string; roomId: string }> }
) {
  const { propertyId, roomId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const room = await roomService.archiveRoom(access.userId!, propertyId, roomId);
    return NextResponse.json({
      id: room.id,
      propertyId: room.propertyId,
      roomNumber: room.roomNumber,
      roomType: room.roomType,
      monthlyRent: room.monthlyRent,
      status: room.status,
      archivedAt: room.archivedAt,
      createdAt: room.createdAt,
      updatedAt: room.updatedAt,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Room not found") {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "Room is already archived") {
      return NextResponse.json({ error: "Room is already archived" }, { status: 409 });
    }
    if (err instanceof Error && err.message === "Cannot archive room with active tenant") {
      return NextResponse.json(
        { error: "Cannot archive room with active tenant" },
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
