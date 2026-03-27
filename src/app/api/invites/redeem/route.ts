import { NextResponse } from "next/server";
import { z } from "zod";
import { inviteService } from "@/lib/invite-service-instance";
import {
  InviteNotFoundError,
  InviteExpiredError,
  InviteAlreadyUsedError,
} from "@/lib/invite-service";
import { prisma } from "@/lib/prisma";

const redeemSchema = z.object({
  token: z.string().min(1),
  userId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, userId } = redeemSchema.parse(body);

    const invite = await inviteService.redeemToken(token);

    // Associate user with property if role is staff and propertyId is set
    if (invite.role === "staff" && invite.propertyId) {
      await prisma.propertyStaff.create({
        data: {
          userId,
          propertyId: invite.propertyId,
        },
      });
    }

    return NextResponse.json({ data: { success: true, role: invite.role, propertyId: invite.propertyId } });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message ?? "Validation failed" }, { status: 400 });
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
