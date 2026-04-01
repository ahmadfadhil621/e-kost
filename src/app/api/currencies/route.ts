import { NextResponse } from "next/server";
import { z } from "zod";
import { createCurrencySchema } from "@/domain/schemas/currency";
import { getSession } from "@/lib/auth-api";
import { currencyService } from "@/lib/currency-service-instance";
import { isDevEmail } from "@/lib/dev-emails";

export async function GET(request: Request) {
  const { errorResponse } = await getSession(request);
  if (errorResponse) { return errorResponse; }

  try {
    const currencies = await currencyService.list();
    return NextResponse.json({ data: currencies });
  } catch (err) {
    console.error("[GET /api/currencies] error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) { return errorResponse; }

  if (!isDevEmail(session!.user.email)) {
    return NextResponse.json({ error: "Only dev accounts can manage currencies" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = createCurrencySchema.parse(body);
    const currency = await currencyService.add(data);
    return NextResponse.json({ data: currency }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    if (err instanceof Error && err.name === "CurrencyExistsError") {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
