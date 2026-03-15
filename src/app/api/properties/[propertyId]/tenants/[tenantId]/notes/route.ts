import { NextResponse } from "next/server";
import { z } from "zod";
import { createNoteSchema } from "@/domain/schemas/tenant-note";
import { withPropertyAccess } from "@/lib/property-access";
import { noteService } from "@/lib/note-service-instance";

function noteToJson(n: {
  id: string;
  tenantId: string;
  content: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: n.id,
    tenantId: n.tenantId,
    content: n.content,
    date: n.date.toISOString().split("T")[0],
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ propertyId: string; tenantId: string }> }
) {
  const { propertyId, tenantId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    const notes = await noteService.listNotes(
      access.userId!,
      propertyId,
      tenantId
    );
    return NextResponse.json(
      notes.map(noteToJson),
      { status: 200 }
    );
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (err.message.includes("not found") || err.message.includes("Tenant not found")) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ propertyId: string; tenantId: string }> }
) {
  const { propertyId, tenantId } = await context.params;
  const access = await withPropertyAccess(propertyId, { request });
  if (access.errorResponse) {
    return access.errorResponse;
  }

  try {
    const body = await request.json();
    const data = createNoteSchema.parse(body);
    const note = await noteService.createNote(
      access.userId!,
      propertyId,
      tenantId,
      data
    );
    return NextResponse.json(noteToJson(note), { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const errors = err.flatten().fieldErrors;
      return NextResponse.json({ errors }, { status: 400 });
    }
    if (err instanceof Error) {
      if (err.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      if (err.message.includes("not found") || err.message.includes("Tenant not found")) {
        return NextResponse.json({ error: err.message }, { status: 404 });
      }
      if (err.message.includes("moved out")) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
