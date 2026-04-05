import { NextResponse } from "next/server";
import { z } from "zod";
import { createRoomSchema } from "@/domain/schemas/room";
import { withPropertyAccess } from "@/lib/property-access";
import { roomService } from "@/lib/room-service-instance";
import { tenantService } from "@/lib/tenant-service-instance";
import { balanceService } from "@/lib/balance-service-instance";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request, requireOwner: true });
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
      const msg = err.issues[0]?.message ?? "Validation failed";
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
    const hasCapacity = searchParams.get("hasCapacity") === "true";

    const filters =
      status && ["available", "occupied", "under_renovation"].includes(status)
        ? { status: status as "available" | "occupied" | "under_renovation" }
        : undefined;
    const rooms = await roomService.listRooms(access.userId!, propertyId, filters);

    const [tenants, balances] = await Promise.all([
      tenantService.listTenants(access.userId!, propertyId),
      balanceService.calculateBalances(access.userId!, propertyId),
    ]);

    // Build a map of roomId → active tenants array
    const tenantsByRoomId = new Map<string, { id: string; name: string; assignedAt: string | null }[]>();
    for (const t of tenants) {
      if (t.roomId && !t.movedOutAt) {
        const list = tenantsByRoomId.get(t.roomId) ?? [];
        const assignedAtIso = t.assignedAt && !isNaN(t.assignedAt.getTime()) ? t.assignedAt.toISOString() : null;
        list.push({ id: t.id, name: t.name, assignedAt: assignedAtIso });
        tenantsByRoomId.set(t.roomId, list);
      }
    }
    const balanceByTenantId = new Map(
      balances.map((b) => [b.tenantId, b.outstandingBalance])
    );

    const roomsWithInfo = rooms
      .map((room) => {
        const roomTenants = tenantsByRoomId.get(room.id) ?? [];
        const activeTenantCount = roomTenants.length;
        const outstandingBalance = roomTenants.reduce(
          (sum, t) => sum + (balanceByTenantId.get(t.id) ?? 0),
          0
        );
        const assignedAtDates = roomTenants
          .map((t) => t.assignedAt)
          .filter((d): d is string => d !== null);
        const assignedAt = assignedAtDates.length > 0
          ? assignedAtDates.reduce((earliest, d) => d < earliest ? d : earliest)
          : null;
        return {
          id: room.id,
          propertyId: room.propertyId,
          roomNumber: room.roomNumber,
          roomType: room.roomType,
          monthlyRent: room.monthlyRent,
          capacity: room.capacity,
          activeTenantCount,
          status: room.status,
          tenants: roomTenants,
          assignedAt,
          ...(activeTenantCount > 0 && { outstandingBalance }),
          createdAt: room.createdAt,
          updatedAt: room.updatedAt,
        };
      })
      .filter((room) => !hasCapacity || room.activeTenantCount < room.capacity);

    return NextResponse.json({
      rooms: roomsWithInfo,
      count: roomsWithInfo.length,
    });
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
