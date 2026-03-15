// Traceability: user-authentication
// REQ 2.2 -> it('calls authClient.signIn.email on signIn')
// REQ 2.3 -> it('throws on signIn error')
// REQ 2.5 -> it('returns user data when session exists')
// REQ 5.2 -> it('calls authClient.signOut on signOut')
// REQ 5.3 -> it('calls authClient.signOut on signOut'), it('throws on signOut error')
// PROP 5  -> it('throws for any error message returned by auth client on signIn')
// PROP 8  -> it('calls signOut on auth client for any authenticated user'), it('throws on signOut error')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import fc from "fast-check";
import { useAuth } from "./use-auth";

vi.mock("@/lib/auth-client", () => {
  const mockSession = {
    data: null as { user: { id: string; name: string; email: string } } | null,
    isPending: false,
    error: null,
  };

  return {
    authClient: {
      useSession: () => mockSession,
      signUp: {
        email: vi.fn(),
      },
      signIn: {
        email: vi.fn(),
      },
      signOut: vi.fn(),
      $Infer: {},
    },
    __mockSession: mockSession,
  };
});

async function getMock() {
  const mod = await import("@/lib/auth-client");
  return mod as typeof mod & {
    __mockSession: {
      data: { user: { id: string; name: string; email: string } } | null;
      isPending: boolean;
      error: unknown;
    };
  };
}

describe("useAuth", () => {
  beforeEach(async () => {
    const mock = await getMock();
    mock.__mockSession.data = null;
    mock.__mockSession.isPending = false;
    mock.__mockSession.error = null;
    vi.clearAllMocks();
  });

  describe("good cases", () => {
    it("returns user as null when no session exists", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
    });

    it("returns user data when session exists", async () => {
      const mock = await getMock();
      mock.__mockSession.data = {
        user: { id: "1", name: "John Doe", email: "john@example.com" },
      };

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
      });
    });

    it("returns loading true when session is pending", async () => {
      const mock = await getMock();
      mock.__mockSession.isPending = true;

      const { result } = renderHook(() => useAuth());

      expect(result.current.loading).toBe(true);
    });

    it("calls authClient.signIn.email on signIn", async () => {
      const mock = await getMock();
      const { authClient } = mock;
      (authClient.signIn.email as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signIn("john@example.com", "password123");
      });

      expect(authClient.signIn.email).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
      });
    });

    it("calls authClient.signUp.email on signUp", async () => {
      const mock = await getMock();
      const { authClient } = mock;
      (authClient.signUp.email as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signUp(
          "john@example.com",
          "password123",
          "John Doe"
        );
      });

      expect(authClient.signUp.email).toHaveBeenCalledWith({
        email: "john@example.com",
        password: "password123",
        name: "John Doe",
      });
    });

    it("calls authClient.signOut on signOut", async () => {
      const mock = await getMock();
      const { authClient } = mock;
      (authClient.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: null,
      });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.signOut();
      });

      expect(authClient.signOut).toHaveBeenCalled();
    });
  });

  describe("bad cases", () => {
    it("throws on signIn error", async () => {
      const mock = await getMock();
      const { authClient } = mock;
      const signInError = { message: "Invalid credentials" };
      (authClient.signIn.email as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: signInError,
      });

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signIn("john@example.com", "wrong");
        })
      ).rejects.toEqual(signInError);
    });

    it("throws on signUp error", async () => {
      const mock = await getMock();
      const { authClient } = mock;
      const signUpError = { message: "Email already registered" };
      (authClient.signUp.email as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: signUpError,
      });

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signUp(
            "existing@example.com",
            "password123",
            "Existing User"
          );
        })
      ).rejects.toEqual(signUpError);
    });

    it("throws on signOut error", async () => {
      const mock = await getMock();
      const { authClient } = mock;
      mock.__mockSession.data = {
        user: { id: "1", name: "John", email: "john@example.com" },
      };
      const signOutError = { message: "Session clear failed" };
      (authClient.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({
        error: signOutError,
      });

      const { result } = renderHook(() => useAuth());

      await expect(
        act(async () => {
          await result.current.signOut();
        })
      ).rejects.toEqual(signOutError);
    });
  });

  describe("edge cases", () => {
    it("provides all expected properties", () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty("user");
      expect(result.current).toHaveProperty("loading");
      expect(result.current).toHaveProperty("signIn");
      expect(result.current).toHaveProperty("signUp");
      expect(result.current).toHaveProperty("signOut");
      expect(typeof result.current.signIn).toBe("function");
      expect(typeof result.current.signUp).toBe("function");
      expect(typeof result.current.signOut).toBe("function");
    });
  });

  describe("property-based tests", () => {
    // Feature: user-authentication, Property 5: Invalid Credentials Rejected (hook level)
    it("throws for any error message returned by auth client on signIn", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 200 }),
          async (errorMessage) => {
            const mock = await getMock();
            const { authClient } = mock;
            const error = { message: errorMessage };
            (
              authClient.signIn.email as ReturnType<typeof vi.fn>
            ).mockResolvedValue({ error });

            const { result } = renderHook(() => useAuth());

            await expect(
              act(async () => {
                await result.current.signIn("test@example.com", "password");
              })
            ).rejects.toEqual(error);
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: user-authentication, Property 8: Logout Clears Session
    it("calls signOut on auth client for any authenticated user", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            id: fc.uuid(),
            name: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter((s) => s.trim().length > 0),
            email: fc
              .tuple(
                fc.stringMatching(/^[a-z][a-z0-9]{0,14}$/),
                fc.stringMatching(/^[a-z]{2,8}\.[a-z]{2,4}$/)
              )
              .map(([local, domain]) => `${local}@${domain}`),
          }),
          async (userData) => {
            const mock = await getMock();
            const { authClient } = mock;
            mock.__mockSession.data = { user: userData };
            (authClient.signOut as ReturnType<typeof vi.fn>).mockResolvedValue({
              error: null,
            });

            const { result } = renderHook(() => useAuth());

            await act(async () => {
              await result.current.signOut();
            });

            expect(authClient.signOut).toHaveBeenCalled();
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
