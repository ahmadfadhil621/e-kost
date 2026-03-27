import { NextResponse } from "next/server";
import { z } from "zod";
import { createInviteSchema } from "@/domain/schemas/invite";
import { getSession } from "@/lib/auth-api";
import { inviteService } from "@/lib/invite-service-instance";
import { isDevEmail } from "@/lib/dev-emails";

export async function POST(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) {return errorResponse;}

  try {
    const body = await request.json();
    const data = createInviteSchema.parse(body);

    if (data.role === "owner" && !isDevEmail(session!.user.email)) {
      return NextResponse.json(
        { error: "Only dev accounts can create owner invites" },
        { status: 403 }
      );
    }

    const invite = await inviteService.createInvite(session!.user.id, data);
    return NextResponse.json({ data: invite }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message ?? "Validation failed" }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) {return errorResponse;}

  try {
    const invites = await inviteService.listInvites(session!.user.id);
    return NextResponse.json({ data: invites });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
