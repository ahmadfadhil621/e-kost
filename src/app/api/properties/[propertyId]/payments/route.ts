import { NextResponse } from "next/server";
import { z } from "zod";
import { createPaymentSchema } from "@/domain/schemas/payment";
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

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    const body = await request.json();
    const data = createPaymentSchema.parse(body);
    const payment = await paymentService.createPayment(
      access.userId!,
      propertyId,
      data
    );
    return NextResponse.json(paymentToJson(payment), { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.flatten().fieldErrors;
      return NextResponse.json({ errors }, { status: 400 });
    }
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (err.message.includes("not found") || err.message.includes("Tenant not found")) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      if (
        err.message.includes("no active room") ||
        err.message.includes("moved out") ||
        err.message.includes("no room assignment")
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
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    const payments = await paymentService.listPayments(
      access.userId!,
      propertyId
    );
    return NextResponse.json(
      payments.map(paymentToJson),
      { status: 200 }
    );
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
