import { NextResponse } from "next/server";
import { z } from "zod";
import { updatePropertySettingsSchema } from "@/domain/schemas/property";
import { withPropertyAccess } from "@/lib/property-access";
import { propertyService } from "@/lib/property-service-instance";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { requireOwner: true, request });
  if (access.errorResponse) {return access.errorResponse;}

  try {
    const body = await request.json();
    const data = updatePropertySettingsSchema.parse(body);
    const property = await propertyService.updatePropertySettings(
      access.userId!,
      propertyId,
      data
    );
    return NextResponse.json({ staffOnlyFinance: property.staffOnlyFinance });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.flatten().fieldErrors;
      return NextResponse.json({ errors }, { status: 400 });
    }
    if (err instanceof Error && err.name === "ForbiddenError") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
