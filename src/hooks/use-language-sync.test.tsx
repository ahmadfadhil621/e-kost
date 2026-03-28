// Traceability: settings-language-persistence
// REQ 3.1 -> it('fetches language from API and calls i18n.changeLanguage when authenticated')
// REQ 3.1 -> it('calls the correct API endpoint')
// REQ 3.2 -> it('does not fetch when unauthenticated')
// REQ 3.2 -> it('does not fetch while auth is loading')
// REQ 3.3 -> it('does not call changeLanguage when API response is not ok')
// REQ 3.3 -> it('does not call changeLanguage when fetch throws')
// PROP 4  -> it('fetches language from API and calls i18n.changeLanguage when authenticated')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type React from "react";

const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/i18n", () => ({
  default: {
    language: "en",
    changeLanguage: mockChangeLanguage,
  },
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("@/hooks/use-auth");
const { useLanguageSync } = await import("./use-language-sync");

const mockFetch = vi.fn();

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  };
}

const authenticatedUser = {
  user: { id: "user-1", name: "Test", email: "test@example.com" },
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

const unauthenticatedUser = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", mockFetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useLanguageSync", () => {
  describe("good cases", () => {
    it("fetches language from API and calls changeLanguage when authenticated", async () => {
      vi.mocked(useAuth).mockReturnValue(authenticatedUser);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { language: "id" } }),
      });

      renderHook(() => useLanguageSync(), { wrapper: makeWrapper() });

      await waitFor(() => {
        expect(mockChangeLanguage).toHaveBeenCalledWith("id");
      });
    });

    it("calls the correct API endpoint", async () => {
      vi.mocked(useAuth).mockReturnValue(authenticatedUser);
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: { language: "en" } }),
      });

      renderHook(() => useLanguageSync(), { wrapper: makeWrapper() });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/user/language");
      });
    });
  });

  describe("bad cases", () => {
    it("does not fetch when unauthenticated", () => {
      vi.mocked(useAuth).mockReturnValue(unauthenticatedUser);

      renderHook(() => useLanguageSync(), { wrapper: makeWrapper() });

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does not call changeLanguage when API returns non-ok response", async () => {
      vi.mocked(useAuth).mockReturnValue(authenticatedUser);
      mockFetch.mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Unauthorized" }),
      });

      renderHook(() => useLanguageSync(), { wrapper: makeWrapper() });

      await new Promise((r) => setTimeout(r, 100));
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });

    it("does not call changeLanguage when fetch throws", async () => {
      vi.mocked(useAuth).mockReturnValue(authenticatedUser);
      mockFetch.mockRejectedValue(new Error("Network error"));

      renderHook(() => useLanguageSync(), { wrapper: makeWrapper() });

      await new Promise((r) => setTimeout(r, 100));
      expect(mockChangeLanguage).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("does not fetch while auth is still loading", () => {
      vi.mocked(useAuth).mockReturnValue({
        ...unauthenticatedUser,
        loading: true,
      });

      renderHook(() => useLanguageSync(), { wrapper: makeWrapper() });

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });
});
