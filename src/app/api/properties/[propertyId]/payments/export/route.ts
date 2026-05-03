import { NextResponse } from "next/server";
import { z } from "zod";
import { withPropertyAccess } from "@/lib/property-access";
import { paymentService } from "@/lib/payment-service-instance";
import { ExportRowCapError } from "@/lib/payment-service";
import { userService } from "@/lib/user-service";
import { paymentFilterSchema } from "@/domain/schemas/payment";

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string }> }
) {
  const { propertyId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  const url = new URL(request.url);
  const rawFilters = {
    dateFrom: url.searchParams.get("dateFrom") ?? undefined,
    dateTo: url.searchParams.get("dateTo") ?? undefined,
  };

  let filters;
  try {
    filters = paymentFilterSchema.parse(rawFilters);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Invalid filters" }, { status: 400 });
    }
    return NextResponse.json({ error: "Invalid filters" }, { status: 400 });
  }

  const userId = access.userId!;
  const [timezone, language] = await Promise.all([
    userService.getTimezone(userId),
    userService.getLanguage(userId),
  ]);

  try {
    const { buffer, filename } = await paymentService.exportPayments(
      userId,
      propertyId,
      filters,
      timezone ?? "Asia/Jakarta",
      language ?? "en"
    );

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    if (err instanceof ExportRowCapError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
