import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/login", "/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ROUTES.some((r) => pathname.startsWith(r));

  // Use fetch instead of auth.api.getSession — Prisma is not edge-runtime compatible.
  // The /api/auth/get-session endpoint is excluded from the matcher so this won't loop.
  // Forward only the cookie header — forwarding all headers causes session lookup to fail.
  const sessionRes = await fetch(
    new URL("/api/auth/get-session", request.url),
    { headers: { cookie: request.headers.get("cookie") ?? "" } }
  );
  const session = sessionRes.ok ? await sessionRes.json() : null;

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon\\.ico).*)"],
};
