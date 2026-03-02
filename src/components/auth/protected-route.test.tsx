import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProtectedRoute } from "./protected-route";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

let mockUser: { id: string; name: string; email: string } | null = null;
let mockLoading = false;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockLoading,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe("ProtectedRoute", () => {
  beforeEach(() => {
    mockUser = null;
    mockLoading = false;
    mockPush.mockClear();
  });

  describe("good cases", () => {
    it("renders children when user is authenticated", () => {
      mockUser = { id: "1", name: "John Doe", email: "john@example.com" };

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.getByText("Protected Content")).toBeInTheDocument();
    });

    it("does not redirect when user is authenticated", () => {
      mockUser = { id: "1", name: "John Doe", email: "john@example.com" };

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("bad cases", () => {
    it("redirects to login when no user and not loading", () => {
      mockUser = null;
      mockLoading = false;

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    it("does not render children when no user", () => {
      mockUser = null;
      mockLoading = false;

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("shows loading state while session is being checked", () => {
      mockLoading = true;
      mockUser = null;

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("does not redirect while loading", () => {
      mockLoading = true;
      mockUser = null;

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      );

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});
