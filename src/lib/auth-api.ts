import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

type Session = { user: { id: string; name: string; email: string }; session: unknown };

/**
 * Get current session. Pass the route's Request so headers are available in tests (Vitest has no Next.js request context).
 */
export async function getSession(
  request?: Request
): Promise<{
  session: Session | null;
  errorResponse?: NextResponse;
}> {
  const headersToUse = request
    ? request.headers
    : await (await import("next/headers")).headers();
  const session = await auth.api.getSession({
    headers: headersToUse,
  });
  if (!session) {
    return {
      session: null,
      errorResponse: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session: session as Session };
}
