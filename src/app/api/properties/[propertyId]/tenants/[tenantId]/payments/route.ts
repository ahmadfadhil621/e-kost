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
  note?: string | null;
}) {
  return {
    id: p.id,
    tenantId: p.tenantId,
    tenantName: p.tenantName,
    amount: p.amount,
    paymentDate: p.paymentDate.toISOString().split("T")[0],
    createdAt: p.createdAt.toISOString(),
    note: p.note ?? null,
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

  const url = new URL(request.url);
  const rawLimit = url.searchParams.get("limit");
  const rawPage = url.searchParams.get("page");

  let options: { limit?: number; page?: number } | undefined;

  if (rawLimit !== null) {
    const limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1) {
      return NextResponse.json({ error: "Invalid limit parameter" }, { status: 400 });
    }
    options = { ...options, limit };
  }
  if (rawPage !== null) {
    const page = Number(rawPage);
    if (!Number.isInteger(page) || page < 1) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }
    options = { ...options, page };
  }

  try {
    const result = await paymentService.listTenantPayments(
      access.userId!,
      propertyId,
      tenantId,
      options
    );
    const response: {
      payments: ReturnType<typeof paymentToJson>[];
      count: number;
      totalPages?: number;
    } = {
      payments: result.payments.map(paymentToJson),
      count: result.count,
    };
    if (result.totalPages !== undefined) {
      response.totalPages = result.totalPages;
    }
    return NextResponse.json(response, { status: 200 });
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
