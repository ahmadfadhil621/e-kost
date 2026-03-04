import { NextResponse } from "next/server";
import { z } from "zod";
import { addStaffSchema } from "@/domain/schemas/property";
import { withPropertyAccess } from "@/lib/property-access";
import { propertyService } from "@/lib/property-service-instance";

export async function POST(
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
    const { email } = addStaffSchema.parse(body);
    const staff = await propertyService.addStaff(
      access.userId!,
      propertyId,
      email
    );
    return NextResponse.json(
      {
        id: staff.id,
        propertyId: staff.propertyId,
        userId: staff.userId,
        user: staff.user,
        assignedAt: staff.assignedAt,
      },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    if (err instanceof Error) {
      if (err.message === "No registered account found for this email") {
        return NextResponse.json(
          { error: "No registered account found for this email" },
          { status: 404 }
        );
      }
      if (
        err.message === "This user is already staff on this property" ||
        err.message === "Cannot add property owner as staff"
      ) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
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
    const staffList = await propertyService.listStaff(access.userId!, propertyId);
    return NextResponse.json(
      staffList.map((s) => ({
        id: s.id,
        propertyId: s.propertyId,
        userId: s.userId,
        user: s.user,
        assignedAt: s.assignedAt,
      }))
    );
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
