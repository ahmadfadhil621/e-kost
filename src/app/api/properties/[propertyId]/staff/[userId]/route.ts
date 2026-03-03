import { NextResponse } from "next/server";

export async function DELETE(
  _request: Request,
  _context: { params: Promise<{ propertyId: string; userId: string }> }
) {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
