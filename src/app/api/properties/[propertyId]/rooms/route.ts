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
    const filters =
      status && ["available", "occupied", "under_renovation"].includes(status)
        ? { status: status as "available" | "occupied" | "under_renovation" }
        : undefined;
    const rooms = await roomService.listRooms(access.userId!, propertyId, filters);

    const [tenants, balances] = await Promise.all([
      tenantService.listTenants(access.userId!, propertyId),
      balanceService.calculateBalances(access.userId!, propertyId),
    ]);
    const tenantByRoomId = new Map<string, { id: string; name: string }>();
    for (const t of tenants) {
      if (t.roomId && !t.movedOutAt) {
        tenantByRoomId.set(t.roomId, { id: t.id, name: t.name });
      }
    }
    const balanceByTenantId = new Map(
      balances.map((b) => [b.tenantId, b.outstandingBalance])
    );

    const roomsWithTenantInfo = rooms.map((room) => {
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
      if (room.status !== "occupied") {
        return base;
      }
      const tenant = tenantByRoomId.get(room.id);
      if (!tenant) {
        return base;
      }
      const outstandingBalance = balanceByTenantId.get(tenant.id) ?? 0;
      return {
        ...base,
        tenantId: tenant.id,
        tenantName: tenant.name,
        outstandingBalance,
      };
    });

    return NextResponse.json({
      rooms: roomsWithTenantInfo,
      count: roomsWithTenantInfo.length,
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
