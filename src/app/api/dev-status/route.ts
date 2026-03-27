import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-api";
import { isDevEmail } from "@/lib/dev-emails";

export async function GET(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) {return errorResponse;}

  const isDev = isDevEmail(session!.user.email);
  return NextResponse.json({ data: { isDev } });
}
