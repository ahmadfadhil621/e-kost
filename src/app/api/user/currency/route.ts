import { NextResponse } from "next/server";

// Currency is now a property-level attribute (Issue #93).
// User-level currency preference has been removed.
const gone = () =>
  NextResponse.json(
    { error: "User-level currency preference has been removed. Currency is now configured per property." },
    { status: 410 }
  );

export async function GET() { return gone(); }
export async function PATCH() { return gone(); }
