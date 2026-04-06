import { NextResponse } from "next/server";
import type { Property, PropertyRole } from "@/domain/schemas/property";
import { getSession } from "@/lib/auth-api";
import { ForbiddenError } from "@/lib/property-service";
import { propertyService } from "@/lib/property-service-instance";

export async function withPropertyAccess(
  propertyId: string,
  options: { requireOwner?: boolean; request?: Request; includeProperty?: boolean } = {}
): Promise<
  | { userId: string; role: PropertyRole; property: Property | null; errorResponse: null }
  | { userId: null; role: null; property: null; errorResponse: NextResponse }
> {
  const { session, errorResponse } = await getSession(options.request);
  if (errorResponse) {return { userId: null, role: null, property: null, errorResponse };}

  try {
    const role = await propertyService.validateAccess(session!.user.id, propertyId);
    if (options.requireOwner && role !== "owner") {
      return {
        userId: null,
        role: null,
        property: null,
        errorResponse: NextResponse.json(
          { error: "Owner access required" },
          { status: 403 }
        ),
      };
    }
    const property = options.includeProperty
      ? await propertyService.getPropertyByIdUnchecked(propertyId)
      : null;
    return { userId: session!.user.id, role, property, errorResponse: null };
  } catch (e) {
    if (e instanceof ForbiddenError) {
      return {
        userId: null,
        role: null,
        property: null,
        errorResponse: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
    return {
      userId: null,
      role: null,
      property: null,
      errorResponse: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}
