import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { propertyService } from "@/lib/property-service-instance";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const property = await propertyService.unarchiveProperty(access.userId!, propertyId);
    return NextResponse.json({
      id: property.id,
      name: property.name,
      address: property.address,
      ownerId: property.ownerId,
      archivedAt: property.archivedAt,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Property not found") {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (err instanceof Error && err.message === "Property is not archived") {
      return NextResponse.json({ error: "Property is not archived" }, { status: 409 });
    }
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
