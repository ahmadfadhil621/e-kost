import { NextResponse } from "next/server";
import { financeSummaryQuerySchema } from "@/domain/schemas/expense";
import { withPropertyAccess } from "@/lib/property-access";
import { financeSummaryService } from "@/lib/finance-summary-service-instance";

function summaryToJson(s: {
  year: number;
  month: number;
  income: number;
  expenses: number;
  netIncome: number;
  categoryBreakdown: { category: string; total: number; count: number }[];
}) {
  return {
    year: s.year,
    month: s.month,
    income: s.income,
    expenses: s.expenses,
    netIncome: s.netIncome,
    categoryBreakdown: s.categoryBreakdown,
  };
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
    const { searchParams } = new URL(request.url);
    const parsed = financeSummaryQuerySchema.parse({
      year: searchParams.get("year"),
      month: searchParams.get("month"),
    });
    const summary = await financeSummaryService.getMonthlySummary(
      access.userId!,
      propertyId,
      parsed.year,
      parsed.month
    );
    return NextResponse.json(summaryToJson(summary), { status: 200 });
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    return NextResponse.json(
      { error: "Invalid year or month" },
      { status: 400 }
    );
  }
}
