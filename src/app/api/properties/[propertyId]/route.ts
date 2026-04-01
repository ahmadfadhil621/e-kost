import { NextResponse } from "next/server";
import { z } from "zod";
import { updatePropertySchema } from "@/domain/schemas/property";
import { withPropertyAccess } from "@/lib/property-access";
import { propertyService } from "@/lib/property-service-instance";

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const property = await propertyService.getProperty(access.userId!, propertyId);
    return NextResponse.json({
      id: property.id,
      name: property.name,
      address: property.address,
      ownerId: property.ownerId,
      archivedAt: property.archivedAt,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
      role: access.role,
    });
  } catch (e) {
    if (e instanceof Error && e.message === "Property not found") {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, {
    requireOwner: true,
    request,
  });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const body = await request.json();
    const data = updatePropertySchema.parse(body);
    const property = await propertyService.updateProperty(
      access.userId!,
      propertyId,
      data
    );
    return NextResponse.json({
      id: property.id,
      name: property.name,
      address: property.address,
      ownerId: property.ownerId,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, {
    requireOwner: true,
    request,
  });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    await propertyService.deleteProperty(access.userId!, propertyId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (e instanceof Error && e.message === "Property not found") {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }
    if (e instanceof Error && e.message === "Cannot delete property with active tenants") {
      return NextResponse.json(
        { error: "Cannot delete property with active tenants" },
        { status: 409 }
      );
    }
    if (e instanceof Error && e.name === "ForbiddenError") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
