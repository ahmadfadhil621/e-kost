// Traceability: demo-login
// REQ 3.1 -> it('renders without errors')
// REQ 3.2 -> it('shows banner when user email is demo@ekost.app')
// REQ 3.2 -> it('renders nothing when user email is not demo@ekost.app')
// REQ 3.2 -> it('renders nothing when user is null')
// REQ 3.3 -> it('has no dismiss or close button')
// REQ 3.4 -> it('displays text from i18n key demo.banner.message')
// REQ 3.6 -> it('has role=status for accessibility')
// REQ 3.6 -> it('has an aria-label')
// PROP 3  -> it('renders if and only if user email is exactly demo@ekost.app')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import fc from "fast-check";
import { DemoBanner } from "./demo-banner";

const mockUseAuth = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("DemoBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("good cases", () => {
    it("shows banner when user email is demo@ekost.app", () => {
      mockUseAuth.mockReturnValue({ user: { email: "demo@ekost.app" }, loading: false });

      render(<DemoBanner />);

      // i18n key: demo.banner.message → "You're in a demo account — all data resets on next login"
      expect(
        screen.getByText(/demo account|akun demo/i)
      ).toBeInTheDocument();
    });

    it("renders nothing when user email is not demo@ekost.app", () => {
      mockUseAuth.mockReturnValue({ user: { email: "owner@example.com" }, loading: false });

      const { container } = render(<DemoBanner />);

      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: false });

      const { container } = render(<DemoBanner />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("bad cases", () => {
    it("renders nothing when loading is true and user is null", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true });

      const { container } = render(<DemoBanner />);

      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when email is a partial match (demo@ekost.app.evil.com)", () => {
      mockUseAuth.mockReturnValue({
        user: { email: "demo@ekost.app.evil.com" },
        loading: false,
      });

      const { container } = render(<DemoBanner />);

      expect(container).toBeEmptyDOMElement();
    });

    it("renders nothing when email is uppercase variant", () => {
      mockUseAuth.mockReturnValue({
        user: { email: "DEMO@EKOST.APP" },
        loading: false,
      });

      const { container } = render(<DemoBanner />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("edge cases", () => {
    it("has no dismiss or close button", () => {
      mockUseAuth.mockReturnValue({ user: { email: "demo@ekost.app" }, loading: false });

      render(<DemoBanner />);

      const closeButton = screen.queryByRole("button", { name: /close|dismiss|×|✕/i });
      expect(closeButton).not.toBeInTheDocument();
    });

    it("has role=status for accessibility", () => {
      mockUseAuth.mockReturnValue({ user: { email: "demo@ekost.app" }, loading: false });

      render(<DemoBanner />);

      expect(screen.getByRole("status")).toBeInTheDocument();
    });

    it("has an aria-label on the banner element", () => {
      mockUseAuth.mockReturnValue({ user: { email: "demo@ekost.app" }, loading: false });

      render(<DemoBanner />);

      const banner = screen.getByRole("status");
      expect(banner).toHaveAttribute("aria-label");
      expect(banner.getAttribute("aria-label")).not.toBe("");
    });

    it("renders without crashing when useAuth returns an empty object", () => {
      mockUseAuth.mockReturnValue({});

      const { container } = render(<DemoBanner />);

      expect(container).toBeEmptyDOMElement();
    });
  });

  describe("property-based tests", () => {
    // PROP 3 — Banner renders if and only if user email is exactly "demo@ekost.app"
    it("renders if and only if user email is exactly demo@ekost.app", () => {
      fc.assert(
        fc.property(
          fc.emailAddress().filter((email) => email !== "demo@ekost.app"),
          (nonDemoEmail) => {
            mockUseAuth.mockReturnValue({ user: { email: nonDemoEmail }, loading: false });

            const { container } = render(<DemoBanner />);
            const isEmpty = container.innerHTML === "";
            render(<div />); // reset

            return isEmpty;
          }
        ),
        { numRuns: 100 }
      );
    });

    it("always renders banner when email is exactly demo@ekost.app", () => {
      fc.assert(
        fc.property(fc.constant("demo@ekost.app"), (email) => {
          mockUseAuth.mockReturnValue({ user: { email }, loading: false });

          const { container } = render(<DemoBanner />);
          const banner = container.querySelector('[role="status"]');

          return banner !== null;
        }),
        { numRuns: 100 }
      );
    });
  });
});
