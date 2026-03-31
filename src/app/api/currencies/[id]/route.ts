import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-api";
import { currencyService } from "@/lib/currency-service-instance";
import { isDevEmail } from "@/lib/dev-emails";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) { return errorResponse; }

  if (!isDevEmail(session!.user.email)) {
    return NextResponse.json({ error: "Only dev accounts can manage currencies" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const getUserCount = (code: string) => prisma.user.count({ where: { currency: code } });
    await currencyService.remove(id, getUserCount);
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    if (err instanceof Error && err.name === "CurrencyInUseError") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof Error && err.name === "LastCurrencyError") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof Error && err.name === "CurrencyNotFoundError") {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
