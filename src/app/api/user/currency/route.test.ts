// Traceability: property-currency (Issue #93)
// Route removed: user-level currency preference replaced by property-level currency.
// Both GET and PATCH now return 410 Gone.

import { describe, it, expect } from "vitest";
import { GET, PATCH } from "./route";

describe("GET /api/user/currency — deprecated (Issue #93)", () => {
  it("returns 410 Gone", async () => {
    const res = await GET();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});

describe("PATCH /api/user/currency — deprecated (Issue #93)", () => {
  it("returns 410 Gone", async () => {
    const res = await PATCH();
    expect(res.status).toBe(410);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });
});
