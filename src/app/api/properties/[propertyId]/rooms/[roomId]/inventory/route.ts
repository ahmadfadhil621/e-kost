import { NextResponse } from "next/server";
import { z } from "zod";
import { createInventoryItemSchema } from "@/domain/schemas/room-inventory-item";
import { withPropertyAccess } from "@/lib/property-access";
import { roomInventoryItemService } from "@/lib/room-inventory-item-service-instance";

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string; roomId: string }> }
) {
  const { propertyId, roomId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const items = await roomInventoryItemService.listItems(
      access.userId!,
      propertyId,
      roomId
    );
    return NextResponse.json({ data: items });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string; roomId: string }> }
) {
  const { propertyId, roomId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const body = await request.json();
    const data = createInventoryItemSchema.parse(body);
    const item = await roomInventoryItemService.addItem(
      access.userId!,
      propertyId,
      roomId,
      data,
      access.role!
    );
    return NextResponse.json({ data: item }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
