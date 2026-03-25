// Traceability: settings-feedback-form
// AC-4.1 -> it('returns 200 and fires webhook for valid message')
// AC-4.2 -> it('returns 400 for empty message')
// AC-4.2 -> it('returns 400 for whitespace-only message')
// AC-4.2 -> it('returns 400 for message exceeding 2000 characters')
// AC-4.3 -> it('fires webhook fire-and-forget without awaiting')
// AC-4.4 -> it('returns 200 even when N8N_WEBHOOK_URL is not set')
// AC-4.5 -> it('returns 200 even when webhook fetch throws')
// AC-5   -> it('does not attach user identity to the webhook payload')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

const WEBHOOK_URL = "https://n8n.example.com/webhook/test";

function makeRequest(body: unknown) {
  return new Request("http://localhost:3000/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/feedback", () => {
  beforeEach(() => {
    process.env.N8N_WEBHOOK_URL = WEBHOOK_URL;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("ok", { status: 200 })));
  });

  afterEach(() => {
    delete process.env.N8N_WEBHOOK_URL;
    vi.unstubAllGlobals();
  });

  describe("good cases", () => {
    it("returns 200 { success: true } for a valid message", async () => {
      const response = await POST(makeRequest({ message: "The app is great but payment dates are confusing." }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
    });

    it("calls the n8n webhook with the message payload", async () => {
      await POST(makeRequest({ message: "Rooms page is hard to navigate on mobile." }));

      expect(fetch).toHaveBeenCalledWith(
        WEBHOOK_URL,
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ message: "Rooms page is hard to navigate on mobile." }),
        })
      );
    });

    it("does not attach user identity to the webhook payload", async () => {
      await POST(makeRequest({ message: "Add dark mode please." }));

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(init?.body as string);
      expect(body).not.toHaveProperty("userId");
      expect(body).not.toHaveProperty("email");
      expect(body).not.toHaveProperty("user");
    });

    it("trims leading/trailing whitespace before forwarding to webhook", async () => {
      await POST(makeRequest({ message: "  Some valid feedback  " }));

      const [, init] = vi.mocked(fetch).mock.calls[0];
      const body = JSON.parse(init?.body as string);
      expect(body.message).toBe("Some valid feedback");
    });
  });

  describe("bad cases", () => {
    it("returns 400 for an empty message", async () => {
      const response = await POST(makeRequest({ message: "" }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("returns 400 for a whitespace-only message", async () => {
      const response = await POST(makeRequest({ message: "   " }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("returns 400 for a message exceeding 2000 characters", async () => {
      const response = await POST(makeRequest({ message: "a".repeat(2001) }));

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty("error");
    });

    it("returns 400 when message field is missing from body", async () => {
      const response = await POST(makeRequest({}));

      expect(response.status).toBe(400);
    });

    it("does not call webhook when validation fails", async () => {
      await POST(makeRequest({ message: "" }));

      expect(fetch).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("fires webhook fire-and-forget — returns 200 even if webhook never resolves", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockReturnValue(new Promise(() => {/* never resolves */}))
      );

      const response = await POST(makeRequest({ message: "This should not block." }));

      // Route must return immediately without awaiting the webhook
      expect(response.status).toBe(200);
    });

    it("returns 200 and logs warning when N8N_WEBHOOK_URL is not set", async () => {
      delete process.env.N8N_WEBHOOK_URL;
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const response = await POST(makeRequest({ message: "Feedback with no webhook configured." }));
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ success: true });
      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });

    it("returns 200 even when webhook fetch throws a network error", async () => {
      // Simulate a fetch that rejects — error must be swallowed
      vi.stubGlobal(
        "fetch",
        vi.fn().mockImplementation(() => {
          // Fire and forget — if the route properly doesn't await, a rejection won't matter
          return Promise.reject(new Error("Network failure"));
        })
      );

      const response = await POST(makeRequest({ message: "Webhook is down." }));

      expect(response.status).toBe(200);
    });

    it("accepts a message exactly at the 2000-character limit", async () => {
      const response = await POST(makeRequest({ message: "a".repeat(2000) }));

      expect(response.status).toBe(200);
    });

    it("accepts a message exactly 1 character long", async () => {
      const response = await POST(makeRequest({ message: "x" }));

      expect(response.status).toBe(200);
    });
  });
});
