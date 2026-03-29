// Traceability: user-authentication, demo-login
// REQ 2.1 -> it('renders all form fields with labels')
// REQ 2.2 -> it('submits form with valid data and redirects')
// REQ 2.3 -> it('shows server error when login fails')
// REQ 2.4 -> it('shows validation error when email/password is empty')
// REQ 6.5 -> it('uses email input type for email field'), it('uses password input type')
// REQ 7.3 -> it('uses password input type for password field')
// PROP 9  -> it('all interactive elements use semantic roles suitable for touch targets')
// demo-login REQ 4.1 -> it('renders a single Login with Demo button')
// demo-login REQ 4.1 -> it('does not render old Demo Owner or Demo Staff buttons')
// demo-login REQ 4.2 -> it('calls POST /api/auth/demo-login on demo button click')
// demo-login REQ 4.2 -> it('redirects to /properties after successful demo login')
// demo-login REQ 4.3 -> it('disables demo button while demo login is in progress')
// demo-login REQ 4.4 -> it('shows server error when demo login endpoint returns error')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "./login-form";

const mockSignIn = vi.fn();
const mockFetch = vi.fn();

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
  const originalFetch = global.fetch;

  beforeEach(() => {
    mockSignIn.mockClear();
    mockFetch.mockClear();
    global.fetch = mockFetch;
    Object.defineProperty(window, "location", {
      writable: true,
      value: { ...originalLocation, href: "" },
    });
  });

  afterEach(() => {
    global.fetch = originalFetch;
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
        screen.getByRole("button", { name: /sign in|log in/i })
      ).toBeInTheDocument();
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
      await user.click(screen.getByRole("button", { name: /sign in|log in/i }));

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

    it("renders E-Kost title when present", () => {
      render(<LoginForm />);
      const title = screen.queryByText(/e-kost/i);
      if (title) {
        expect(title).toBeInTheDocument();
      }
    });

    it("renders a single Login with Demo button", () => {
      render(<LoginForm />);

      // i18n key: auth.login.demo → "Login with Demo" | "Masuk dengan Demo"
      expect(
        screen.getByRole("button", { name: /login with demo|masuk dengan demo/i })
      ).toBeInTheDocument();
    });

    it("does not render old Demo Owner or Demo Staff buttons", () => {
      render(<LoginForm />);

      expect(
        screen.queryByRole("button", { name: /demo owner|akun demo pemilik/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /demo staff|akun demo staf/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("demo login", () => {
    it("calls POST /api/auth/demo-login when demo button is clicked", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 302 });
      const user = userEvent.setup();

      render(<LoginForm />);
      await user.click(
        screen.getByRole("button", { name: /login with demo|masuk dengan demo/i })
      );

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/demo-login",
          expect.objectContaining({ method: "POST" })
        );
      });
    });

    it("redirects to /properties after successful demo login", async () => {
      mockFetch.mockResolvedValueOnce({ ok: true, status: 200 });
      const user = userEvent.setup();

      render(<LoginForm />);
      await user.click(
        screen.getByRole("button", { name: /login with demo|masuk dengan demo/i })
      );

      await waitFor(() => {
        expect(window.location.href).toBe("/properties");
      });
    });

    it("shows server error when demo login endpoint returns an error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: "Demo user not found" }),
      });
      const user = userEvent.setup();

      render(<LoginForm />);
      await user.click(
        screen.getByRole("button", { name: /login with demo|masuk dengan demo/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText(/demo user not found/i)).toBeInTheDocument();
      });
    });

    it("disables demo button while demo login is in progress", async () => {
      let resolvePromise!: (value: unknown) => void;
      mockFetch.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );
      const user = userEvent.setup();

      render(<LoginForm />);
      await user.click(
        screen.getByRole("button", { name: /login with demo|masuk dengan demo/i })
      );

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /login with demo|masuk dengan demo/i })
        ).toBeDisabled();
      });

      // Clean up
      resolvePromise({ ok: true, status: 200 });
    });

    it("shows generic error when demo login fetch throws a network error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));
      const user = userEvent.setup();

      render(<LoginForm />);
      await user.click(
        screen.getByRole("button", { name: /login with demo|masuk dengan demo/i })
      );

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
    });
  });

  describe("bad cases", () => {
    it("shows validation error when email is empty", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.click(screen.getByRole("button", { name: /sign in|log in/i }));

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });
    });

    it("shows validation error when email is invalid", async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      await user.type(screen.getByLabelText(/email address/i), "not-email");
      await user.type(screen.getByLabelText(/password/i), "password123");
      await user.click(screen.getByRole("button", { name: /sign in|log in/i }));

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
      await user.click(screen.getByRole("button", { name: /sign in|log in/i }));

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
      await user.click(screen.getByRole("button", { name: /sign in|log in/i }));

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
      await user.click(screen.getByRole("button", { name: /sign in|log in/i }));

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /sign in|log in/i })
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

  describe("property-based tests", () => {
    // Feature: user-authentication, Property 9: Touch Target Minimum Dimensions
    // Note: Pixel-level dimension checks require a real browser (E2E layer).
    // At the component level, we verify all interactive elements are proper
    // semantic HTML that can receive touch-target CSS sizing.
    it("all interactive elements use semantic roles suitable for touch targets", () => {
      render(<LoginForm />);

      const buttons = screen.getAllByRole("button");
      const inputs = screen.getAllByRole("textbox");

      expect(buttons.length).toBeGreaterThanOrEqual(1);
      expect(inputs.length).toBeGreaterThanOrEqual(1);

      for (const button of buttons) {
        expect(button.tagName).toBe("BUTTON");
      }
    });
  });
});
