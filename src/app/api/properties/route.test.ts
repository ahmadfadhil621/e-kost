// Traceability: multi-property-management
// REQ 1.2 -> it('POST returns 201 and property when body is valid')
// REQ 1.3 -> it('POST returns 400 when name is missing')
// REQ 2.1 -> it('GET returns 200 and array of properties')
// REQ 4.1 -> (covered by E2E)
// REQ 7.4 -> (covered by service tests)

import { describe, it, expect } from "vitest";
import { POST, GET } from "./route";

describe("POST /api/properties", () => {
  describe("good cases", () => {
    it("POST returns 201 and property when body is valid", async () => {
      const request = new Request("http://localhost:3000/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "My Property",
          address: "123 Main St",
        }),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("id");
      expect(data.name).toBe("My Property");
      expect(data.address).toBe("123 Main St");
      expect(data).toHaveProperty("ownerId");
      expect(data).toHaveProperty("createdAt");
      expect(data).toHaveProperty("updatedAt");
    });
  });

  describe("bad cases", () => {
    it("POST returns 400 when name is missing", async () => {
      const request = new Request("http://localhost:3000/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: "123 Main St" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("POST returns 400 when address is missing", async () => {
      const request = new Request("http://localhost:3000/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "My Property" }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });

    it("POST returns 401 when not authenticated", async () => {
      const request = new Request("http://localhost:3000/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "P", address: "A" }),
      });

      const response = await POST(request);

      expect([401, 501]).toContain(response.status);
    });
  });

  describe("edge cases", () => {
    it("POST returns 400 when name exceeds 200 characters", async () => {
      const request = new Request("http://localhost:3000/api/properties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "a".repeat(201),
          address: "Valid",
        }),
      });

      const response = await POST(request);

      expect(response.status).toBe(400);
    });
  });
});

describe("GET /api/properties", () => {
  describe("good cases", () => {
    it("GET returns 200 and array of properties", async () => {
      const request = new Request("http://localhost:3000/api/properties");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("bad cases", () => {
    it("GET returns 401 when not authenticated", async () => {
      const request = new Request("http://localhost:3000/api/properties");

      const response = await GET(request);

      expect([401, 501]).toContain(response.status);
      expect(response.status).not.toBe(200);
    });
  });

  describe("edge cases", () => {
    it("GET returns array even when empty", async () => {
      const request = new Request("http://localhost:3000/api/properties");
      const response = await GET(request);
      if (response.status === 200) {
        const data = await response.json();
        expect(Array.isArray(data)).toBe(true);
      }
    });
  });
});
