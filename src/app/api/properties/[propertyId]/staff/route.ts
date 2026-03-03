import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  _context: { params: Promise<{ propertyId: string }> }
) {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}

export async function GET(
  _request: Request,
  _context: { params: Promise<{ propertyId: string }> }
) {
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
