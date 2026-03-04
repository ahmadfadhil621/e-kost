import { NextResponse } from "next/server";
import { z } from "zod";
import { createTenantSchema } from "@/domain/schemas/tenant";
import { withPropertyAccess } from "@/lib/property-access";
import { tenantService } from "@/lib/tenant-service-instance";

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const body = await request.json();
    const data = createTenantSchema.parse(body);
    const tenant = await tenantService.createTenant(
      access.userId!,
      propertyId,
      data
    );
    return NextResponse.json(
      {
        id: tenant.id,
        propertyId: tenant.propertyId,
        name: tenant.name,
        phone: tenant.phone,
        email: tenant.email,
        roomId: tenant.roomId,
        assignedAt: tenant.assignedAt,
        createdAt: tenant.createdAt,
        updatedAt: tenant.updatedAt,
        movedOutAt: tenant.movedOutAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
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
    const tenants = await tenantService.listTenants(
      access.userId!,
      propertyId
    );
    return NextResponse.json({ tenants, count: tenants.length });
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
