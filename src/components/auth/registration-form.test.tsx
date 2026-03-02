import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegistrationForm } from "./registration-form";

const mockSignUp = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: mockSignUp,
    signOut: vi.fn(),
  }),
}));

describe("RegistrationForm", () => {
  const originalLocation = window.location;

  beforeEach(() => {
    mockSignUp.mockClear();
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    });
  });

  describe("good cases", () => {
    it("renders all form fields with labels", () => {
      render(<RegistrationForm />);

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<RegistrationForm />);

      expect(
        screen.getByRole("button", { name: /register/i })
      ).toBeInTheDocument();
    });

    it("renders link to login page", () => {
      render(<RegistrationForm />);

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /log in/i })).toHaveAttribute(
        "href",
        "/login"
      );
    });

    it("submits form with valid data and redirects", async () => {
      mockSignUp.mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /register/i }));

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith(
          "john@example.com",
          "password123",
          "John Doe"
        );
      });

      await waitFor(() => {
        expect(window.location.href).toBe("/");
      });
    });

    it("uses email input type for email field", () => {
      render(<RegistrationForm />);

      expect(screen.getByLabelText(/email address/i)).toHaveAttribute(
        "type",
        "email"
      );
    });

    it("uses password input type for password field", () => {
      render(<RegistrationForm />);

      expect(screen.getByLabelText(/password/i)).toHaveAttribute(
        "type",
        "password"
      );
    });
  });

  describe("bad cases", () => {
    it("shows validation error when name is empty", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.click(screen.getByRole("button", { name: /register/i }));

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });
    });

    it("shows validation error when email is invalid", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/full name/i), "John");
      await user.type(screen.getByLabelText(/email address/i), "not-email");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /register/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/invalid email address/i)
        ).toBeInTheDocument();
      });
    });

    it("shows validation error when password is too short", async () => {
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/full name/i), "John");
      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "short");
      await user.click(screen.getByRole("button", { name: /register/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/password must be at least 8 characters/i)
        ).toBeInTheDocument();
      });
    });

    it("shows server error when signup fails", async () => {
      mockSignUp.mockRejectedValue({
        message: "This email is already registered",
      });
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(
        screen.getByLabelText(/email address/i),
        "existing@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /register/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/this email is already registered/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("edge cases", () => {
    it("disables submit button while submitting", async () => {
      mockSignUp.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      );
      const user = userEvent.setup();
      render(<RegistrationForm />);

      await user.type(screen.getByLabelText(/full name/i), "John Doe");
      await user.type(
        screen.getByLabelText(/email address/i),
        "john@example.com"
      );
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /register/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /register/i })
        ).toBeDisabled();
      });
    });

    it("all form fields have associated labels for accessibility", () => {
      render(<RegistrationForm />);

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);

      expect(nameInput.tagName).toBe("INPUT");
      expect(emailInput.tagName).toBe("INPUT");
      expect(passwordInput.tagName).toBe("INPUT");
    });
  });
});
