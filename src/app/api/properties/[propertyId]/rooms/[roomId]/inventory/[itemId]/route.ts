import { NextResponse } from "next/server";
import { z } from "zod";
import { updateInventoryItemSchema } from "@/domain/schemas/room-inventory-item";
import { withPropertyAccess } from "@/lib/property-access";
import { roomInventoryItemService } from "@/lib/room-inventory-item-service-instance";

export async function PUT(
  request: Request,
  context: { params: Promise<{ propertyId: string; roomId: string; itemId: string }> }
) {
  const { propertyId, roomId: _roomId, itemId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const body = await request.json();
    const data = updateInventoryItemSchema.parse(body);
    const item = await roomInventoryItemService.updateItem(
      access.userId!,
      propertyId,
      itemId,
      data,
      access.role!
    );
    return NextResponse.json({ data: item });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (err instanceof Error && err.message === "Item not found") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ propertyId: string; roomId: string; itemId: string }> }
) {
  const { propertyId, itemId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    await roomInventoryItemService.deleteItem(
      access.userId!,
      propertyId,
      itemId,
      access.role!
    );
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error && err.message === "Item not found") {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
