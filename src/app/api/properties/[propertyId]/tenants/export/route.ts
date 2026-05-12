import { NextResponse } from "next/server";
import { withPropertyAccess } from "@/lib/property-access";
import { balanceService } from "@/lib/balance-service-instance";
import { ExportRowCapError } from "@/lib/balance-service";
import { userService } from "@/lib/user-service";

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
  const statusParam = url.searchParams.get("status");
  const status: "paid" | "unpaid" | undefined =
    statusParam === "unpaid" ? "unpaid" :
    statusParam === "paid" ? "paid" :
    undefined;

  const userId = access.userId!;
  const [timezone, language] = await Promise.all([
    userService.getTimezone(userId),
    userService.getLanguage(userId),
  ]);

  try {
    const { buffer, filename } = await balanceService.exportOutstandingBalances(
      userId,
      propertyId,
      status,
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
