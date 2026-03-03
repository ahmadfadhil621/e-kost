import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  _context: { params: Promise<{ propertyId: string }> }
) {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}

export async function PUT(
  _request: Request,
  _context: { params: Promise<{ propertyId: string }> }
) {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}

export async function DELETE(
  _request: Request,
  _context: { params: Promise<{ propertyId: string }> }
) {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
