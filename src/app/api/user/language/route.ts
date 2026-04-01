import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth-api";
import { userService } from "@/lib/user-service";
import { updateLanguageSchema } from "@/domain/schemas/user";

export async function GET(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) { return errorResponse; }

  try {
    const language = await userService.getLanguage(session!.user.id);
    return NextResponse.json({ data: { language } });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) { return errorResponse; }

  try {
    const body = await request.json();
    const { language } = updateLanguageSchema.parse(body);
    const updated = await userService.updateLanguage(session!.user.id, language);
    return NextResponse.json({ data: { language: updated } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.issues[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
