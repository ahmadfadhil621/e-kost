import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

const mockSignIn = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: mockSignIn,
    signUp: vi.fn(),
    signOut: vi.fn(),
  }),
}));

describe("LoginForm", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    mockSignIn.mockClear();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    });
  });

  describe("good cases", () => {
    it("renders all form fields with labels", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<LoginForm />);

      expect(
        screen.getByRole("button", { name: /log in/i })
      ).toBeInTheDocument();
    });

    it("renders link to registration page", () => {
      render(<LoginForm />);

      expect(
        screen.getByText(/don't have an account/i)
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /create account/i })
      ).toHaveAttribute("href", "/register");
    });

    it("submits form with valid data and redirects", async () => {
      mockSignIn.mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledWith(
          "john@example.com",
          "password123"
        );
      });

      await waitFor(() => {
        expect(window.location.href).toBe("/");
      });
    });

    it("uses email input type for email field", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
        "type",
        "email"
      );
    });

    it("uses password input type for password field", () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        "type",
        "password"
      );
    });
  });

  describe("bad cases", () => {
    it("shows validation error when email is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByRole("button", { name: /log in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it("shows validation error when email is invalid", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email address/i), "not-email");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email address/i)
        ).toBeInTheDocument();
      });
    });

    it("shows validation error when password is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.click(screen.getByRole("button", { name: /log in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/password is required/i)
        ).toBeInTheDocument();
      });
    });

    it("shows server error when login fails", async () => {
      mockSignIn.mockRejectedValue({
        message: "Invalid email or password",
      });
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "wrongpassword");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email or password/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("edge cases", () => {
    it("disables submit button while submitting", async () => {
      mockSignIn.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /log in/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /log in/i })
        ).toBeDisabled();
      });
    });

    it("all form fields have associated labels for accessibility", () => {
      render(<LoginForm />);

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(emailInput.tagName).toBe("INPUT");
      expect(passwordInput.tagName).toBe("INPUT");
    });
  });
});
