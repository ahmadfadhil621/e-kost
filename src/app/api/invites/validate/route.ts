import { NextResponse } from "next/server";
import { inviteService } from "@/lib/invite-service-instance";
import {
  InviteNotFoundError,
  InviteExpiredError,
  InviteAlreadyUsedError,
} from "@/lib/invite-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  try {
    const invite = await inviteService.validateToken(token);
    return NextResponse.json({
      data: {
        email: invite.email,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (err) {
    if (
      err instanceof InviteNotFoundError ||
      err instanceof InviteExpiredError ||
      err instanceof InviteAlreadyUsedError
    ) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
