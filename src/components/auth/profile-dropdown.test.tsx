// Traceability: user-authentication
// REQ 4.1 -> it('renders profile icon with user initials')
// REQ 4.2 -> it('renders profile icon with user initials')
// REQ 4.3 -> it('shows dropdown with user name and email on click')
// REQ 4.4 -> it('shows logout option in dropdown')
// REQ 5.1 -> it('shows logout option in dropdown'), it('shows Settings link in dropdown'), it('clicking Settings navigates to /settings')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileDropdown } from "./profile-dropdown";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
}));

const mockSignOut = vi.fn();
let mockUser: { id: string; name: string; email: string } | null = null;

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: mockSignOut,
  }),
}));

describe("ProfileDropdown", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSignOut.mockClear();
    mockUser = { id: "1", name: "John Doe", email: "john@example.com" };
  });

  describe("good cases", () => {
    it("renders profile button with user initials", () => {
      render(<ProfileDropdown />);

      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("profile button has accessible label", () => {
      render(<ProfileDropdown />);

      expect(
        screen.getByRole("button", { name: /user profile/i })
      ).toBeInTheDocument();
    });

    it("shows name and email on button click", async () => {
      const user = userEvent.setup();
      render(<ProfileDropdown />);

      await user.click(
        screen.getByRole("button", { name: /user profile/i })
      );

      await waitFor(() => {
        expect(screen.getByText("John Doe")).toBeInTheDocument();
        expect(screen.getByText("john@example.com")).toBeInTheDocument();
      });
    });

    it("shows logout button in dropdown", async () => {
      const user = userEvent.setup();
      render(<ProfileDropdown />);

      await user.click(
        screen.getByRole("button", { name: /user profile/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/log out/i)).toBeInTheDocument();
      });
    });

    it("shows Settings link in dropdown", async () => {
      const user = userEvent.setup();
      render(<ProfileDropdown />);

      await user.click(
        screen.getByRole("button", { name: /user profile/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /settings|pengaturan/i })).toBeInTheDocument();
      });
    });

    it("clicking Settings navigates to /settings", async () => {
      const user = userEvent.setup();
      render(<ProfileDropdown />);

      await user.click(
        screen.getByRole("button", { name: /user profile/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("menuitem", { name: /settings|pengaturan/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole("menuitem", { name: /settings|pengaturan/i }));

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/settings");
      });
    });

    it("calls signOut and redirects on logout click", async () => {
      mockSignOut.mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<ProfileDropdown />);

      await user.click(
        screen.getByRole("button", { name: /user profile/i })
      );

      await waitFor(() => {
        expect(screen.getByText(/log out/i)).toBeInTheDocument();
      });

      await user.click(screen.getByText(/log out/i));

      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });

    it("renders single initial for one-word name", () => {
      mockUser = { id: "2", name: "Alice", email: "alice@example.com" };
      render(<ProfileDropdown />);

      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("renders nothing when no user", () => {
      mockUser = null;
      const { container } = render(<ProfileDropdown />);

      expect(container.innerHTML).toBe("");
    });
  });

  describe("edge cases", () => {
    it("profile button has minimum 44x44px touch target", () => {
      render(<ProfileDropdown />);

      const button = screen.getByRole("button", { name: /user profile/i });
      expect(button.className).toContain("min-h-[44px]");
      expect(button.className).toContain("min-w-[44px]");
    });
  });
});
