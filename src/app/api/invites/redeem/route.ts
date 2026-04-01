import { NextResponse } from "next/server";
import { z } from "zod";
import { inviteService } from "@/lib/invite-service-instance";
import {
  InviteNotFoundError,
  InviteExpiredError,
  InviteAlreadyUsedError,
} from "@/lib/invite-service";

const redeemSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = redeemSchema.parse(body);

    await inviteService.redeemToken(token);

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0]?.message ?? "Validation failed" }, { status: 400 });
    }
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
