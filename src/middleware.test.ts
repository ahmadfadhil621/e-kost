// Traceability: auth-landing
// REQ 1.1 -> it('unauthenticated user on / is redirected to /login')
// REQ 1.2 -> it('unauthenticated user on /settings is redirected to /login')
// REQ 1.3 -> it('unauthenticated user on /login passes through')
// REQ 1.4 -> it('unauthenticated user on /register passes through')
// REQ 2.1 -> it('authenticated user on /login is redirected to /')
// REQ 2.2 -> it('authenticated user on /register is redirected to /')
// REQ 2.3 -> it('authenticated user on / passes through')

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

vi.mock("next/server", () => ({
  NextResponse: {
    redirect: vi.fn().mockReturnValue({ _type: "redirect" }),
    next: vi.fn().mockReturnValue({ _type: "next" }),
  },
}));

import { NextResponse } from "next/server";
import { middleware } from "./middleware";

function makeRequest(pathname: string): NextRequest {
  const url = new URL(pathname, "http://localhost");
  return {
    headers: new Headers(),
    nextUrl: url,
    url: url.toString(),
  } as unknown as NextRequest;
}

const fakeSession = {
  user: { id: "user-1", name: "Test User", email: "test@example.com" },
  session: { id: "session-1", expiresAt: new Date(Date.now() + 86400000) },
};

function mockAuthenticated() {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => fakeSession,
  });
}

function mockUnauthenticated() {
  mockFetch.mockResolvedValue({ ok: false });
}

describe("middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(NextResponse.redirect).mockReturnValue(
      { _type: "redirect" } as unknown as ReturnType<typeof NextResponse.redirect>
    );
    vi.mocked(NextResponse.next).mockReturnValue(
      { _type: "next" } as unknown as ReturnType<typeof NextResponse.next>
    );
  });

  describe("good cases", () => {
    it("unauthenticated user on / is redirected to /login", async () => {
      mockUnauthenticated();

      await middleware(makeRequest("/"));

      expect(NextResponse.redirect).toHaveBeenCalledOnce();
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("unauthenticated user on /settings is redirected to /login", async () => {
      mockUnauthenticated();

      await middleware(makeRequest("/settings"));

      expect(NextResponse.redirect).toHaveBeenCalledOnce();
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/login");
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("authenticated user on / passes through", async () => {
      mockAuthenticated();

      await middleware(makeRequest("/"));

      expect(NextResponse.next).toHaveBeenCalledOnce();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe("bad cases", () => {
    it("unauthenticated user on /login passes through without redirect", async () => {
      mockUnauthenticated();

      await middleware(makeRequest("/login"));

      expect(NextResponse.next).toHaveBeenCalledOnce();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it("unauthenticated user on /register passes through without redirect", async () => {
      mockUnauthenticated();

      await middleware(makeRequest("/register"));

      expect(NextResponse.next).toHaveBeenCalledOnce();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("authenticated user on /login is redirected to /", async () => {
      mockAuthenticated();

      await middleware(makeRequest("/login"));

      expect(NextResponse.redirect).toHaveBeenCalledOnce();
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/");
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("authenticated user on /register is redirected to /", async () => {
      mockAuthenticated();

      await middleware(makeRequest("/register"));

      expect(NextResponse.redirect).toHaveBeenCalledOnce();
      const redirectUrl = vi.mocked(NextResponse.redirect).mock.calls[0][0] as URL;
      expect(redirectUrl.pathname).toBe("/");
      expect(NextResponse.next).not.toHaveBeenCalled();
    });

    it("unauthenticated user on /login/extra passes through (startsWith check)", async () => {
      mockUnauthenticated();

      await middleware(makeRequest("/login/extra"));

      expect(NextResponse.next).toHaveBeenCalledOnce();
      expect(NextResponse.redirect).not.toHaveBeenCalled();
    });

    it("passes only cookie header to session fetch", async () => {
      mockUnauthenticated();
      const request = makeRequest("/");

      await middleware(request);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.objectContaining({ pathname: "/api/auth/get-session" }),
        { headers: { cookie: "" } }
      );
    });
  });
});
