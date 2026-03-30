import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { paymentService } from "@/lib/payment-service-instance";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ propertyId: string; paymentId: string }> }
) {
  const { propertyId, paymentId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    await paymentService.deletePayment(access.userId!, propertyId, paymentId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (err.message.includes("not found")) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
