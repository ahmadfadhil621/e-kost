import { NextResponse } from "next/server";
import { z } from "zod";
import { feedbackSchema } from "@/domain/schemas/feedback";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = feedbackSchema.parse(body);

    const webhookUrl = process.env.N8N_WEBHOOK_URL;
    if (webhookUrl) {
      void fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: data.message }),
      });
    } else {
      console.warn("N8N_WEBHOOK_URL is not set — feedback not forwarded");
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      const msg = err.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: msg }, { status: 400 });
    }
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}
