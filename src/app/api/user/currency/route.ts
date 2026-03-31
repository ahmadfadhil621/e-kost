import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-api";
import { userService } from "@/lib/user-service";
import { updateUserCurrencySchema } from "@/domain/schemas/currency";

export async function GET(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) { return errorResponse; }

  try {
    const currency = await userService.getCurrency(session!.user.id);
    return NextResponse.json({ data: { currency } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) { return errorResponse; }

  try {
    const body = await request.json();
    const { currency } = updateUserCurrencySchema.parse(body);
    const updated = await userService.updateCurrency(session!.user.id, currency);
    return NextResponse.json({ data: { currency: updated } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
