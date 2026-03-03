import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { propertyService } from "@/lib/property-service-instance";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ propertyId: string; userId: string }> }
) {
  const { propertyId, userId: staffUserId } = await context.params;
  const access = await withPropertyAccess(propertyId, {
    requireOwner: true,
    request,
  });
  if (access.errorResponse) return access.errorResponse;

  try {
    await propertyService.removeStaff(access.userId!, propertyId, staffUserId);
    return new NextResponse(null, { status: 204 });
  } catch (e) {
    if (
      e instanceof Error &&
      e.message === "Cannot remove the property owner"
    ) {
      return NextResponse.json(
        { error: "Cannot remove the property owner" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
