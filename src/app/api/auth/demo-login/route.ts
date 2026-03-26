import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { seedDemoData } from "@/lib/demo-seed";

export async function POST(request: Request) {
  try {
    const demoPassword = process.env.DEMO_PASSWORD;
    if (!demoPassword) {
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }

    const demoUser = await prisma.user.findUnique({
      where: { email: "demo@ekost.app" },
    });
    if (!demoUser) {
      return NextResponse.json({ error: "Demo user not found" }, { status: 404 });
    }

    await prisma.payment.deleteMany({ where: { tenant: { property: { ownerId: demoUser.id } } } });
    await prisma.tenantNote.deleteMany({ where: { tenant: { property: { ownerId: demoUser.id } } } });
    await prisma.tenant.deleteMany({ where: { property: { ownerId: demoUser.id } } });
    await prisma.expense.deleteMany({ where: { property: { ownerId: demoUser.id } } });
    await prisma.room.deleteMany({ where: { property: { ownerId: demoUser.id } } });
    await prisma.property.deleteMany({ where: { ownerId: demoUser.id } });

    await seedDemoData(demoUser.id);

    const signInResponse = await auth.api.signInEmail({
      body: { email: "demo@ekost.app", password: demoPassword as string },
      headers: request.headers,
      asResponse: true,
    });

    const redirectResponse = NextResponse.redirect(new URL("/", request.url), 302);
    const cookies = signInResponse.headers.getSetCookie();
    for (const cookie of cookies) {
      redirectResponse.headers.append("set-cookie", cookie);
    }
    return redirectResponse;
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
