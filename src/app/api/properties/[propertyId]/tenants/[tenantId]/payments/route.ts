import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { paymentService } from "@/lib/payment-service-instance";

function paymentToJson(p: {
  id: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  paymentDate: Date;
  createdAt: Date;
}) {
  return {
    id: p.id,
    tenantId: p.tenantId,
    tenantName: p.tenantName,
    amount: p.amount,
    paymentDate: p.paymentDate.toISOString().split("T")[0],
    createdAt: p.createdAt.toISOString(),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string; tenantId: string }> }
) {
  const { propertyId, tenantId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    const result = await paymentService.listTenantPayments(
      access.userId!,
      propertyId,
      tenantId
    );
    return NextResponse.json(
      {
        payments: result.payments.map(paymentToJson),
        count: result.count,
      },
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (err.message.includes("not found") || err.message.includes("Tenant not found")) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
