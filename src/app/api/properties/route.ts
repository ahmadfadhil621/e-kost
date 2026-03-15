import { NextResponse } from "next/server";
import { z } from "zod";
import { createPropertySchema } from "@/domain/schemas/property";
import { getSession } from "@/lib/auth-api";
import { propertyService } from "@/lib/property-service-instance";

export async function POST(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) {return errorResponse;}

  try {
    const body = await request.json();
    const data = createPropertySchema.parse(body);
    const property = await propertyService.createProperty(session!.user.id, data);
    return NextResponse.json(
      {
        id: property.id,
        name: property.name,
        address: property.address,
        ownerId: property.ownerId,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) {return errorResponse;}

  try {
    const properties = await propertyService.listProperties(session!.user.id);
    return NextResponse.json(
      properties.map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        ownerId: p.ownerId,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        deletedAt: p.deletedAt,
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
