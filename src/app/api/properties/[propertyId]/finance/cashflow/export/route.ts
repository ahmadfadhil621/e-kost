import { NextResponse } from "next/server";
import { z } from "zod";
import { withPropertyAccess } from "@/lib/property-access";
import { cashflowService } from "@/lib/cashflow-service-instance";
import { ExportRowCapError } from "@/lib/cashflow-service";
import { userService } from "@/lib/user-service";
import { cashflowExportQuerySchema } from "@/domain/schemas/cashflow";

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
  const rawFilters: Record<string, string | undefined> = {};
  const year = url.searchParams.get("year");
  const month = url.searchParams.get("month");
  if (year !== null) { rawFilters.year = year; }
  if (month !== null) { rawFilters.month = month; }

  let filters;
  try {
    filters = cashflowExportQuerySchema.parse(rawFilters);
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
    const { buffer, filename } = await cashflowService.exportCashflow(
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
