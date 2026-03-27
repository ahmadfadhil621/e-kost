import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-api";
import { inviteService } from "@/lib/invite-service-instance";
import { ForbiddenError } from "@/lib/invite-service";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, errorResponse } = await getSession(request);
  if (errorResponse) {return errorResponse;}

  try {
    const { id } = await params;
    await inviteService.revokeInvite(session!.user.id, id);
    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof Error && err.message === "Cannot revoke a used invite") {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
