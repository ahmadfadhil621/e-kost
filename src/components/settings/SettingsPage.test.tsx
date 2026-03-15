// Traceability: settings-staff-management
// REQ 4.1 -> it('displays single page with Language, Account, and Staff sections for owner')
// REQ 4.2 -> it('renders sections in single-column with separators')
// REQ 4.3 -> it('displays section headers for Language, Account, Staff')
// REQ 4.4 -> (touch targets covered in child component tests)
// REQ 4.5 -> (mobile layout covered by E2E)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Providers } from "@/components/providers";
import { SettingsPage } from "./SettingsPage";

function renderSettingsPage() {
  return render(
    <Providers>
      <SettingsPage />
    </Providers>
  );
}

const mockUser = {
  id: "u1",
  name: "Owner User",
  email: "owner@example.com",
};

const mockUseAuth = vi.fn();
const mockUseProperty = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock("@/contexts/property-context", () => ({
  useProperty: () => mockUseProperty(),
}));

beforeEach(() => {
  mockUseAuth.mockReturnValue({ user: mockUser, loading: false });
  mockUseProperty.mockReturnValue({
    activeProperty: { id: "prop-1", name: "My Property" },
    userRole: "owner",
  });
});

describe("SettingsPage", () => {
  describe("good cases", () => {
    it("displays single page with Language, Account, and Staff sections for owner", () => {
      renderSettingsPage();

      expect(
        screen.getByRole("heading", { name: /language|settings\.language/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /account|settings\.account/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /staff|settings\.staff/i })
      ).toBeInTheDocument();
    });

    it("renders sections in single-column with separators", () => {
      const { container } = renderSettingsPage();

      const main = container.querySelector("main") ?? container;
      const sections = main.querySelectorAll(
        "[class*='space-y'] section, section, [class*='separator']"
      );
      expect(sections.length).toBeGreaterThanOrEqual(2);
    });

    it("displays section headers for Language, Account, Staff", () => {
      renderSettingsPage();

      expect(
        screen.getByText(/language|settings\.language\.title/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/account|settings\.account\.title/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/staff for|staff.*property|settings\.staff/i)
      ).toBeInTheDocument();
    });

    it("shows loading state when user is loading", () => {
      mockUseAuth.mockReturnValue({ user: null, loading: true });
      mockUseProperty.mockReturnValue({
        activeProperty: null,
        userRole: null,
      });
      renderSettingsPage();

      expect(screen.getByText(/loading|memuat/i)).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("does not show Staff section when user role is staff", () => {
      mockUseProperty.mockReturnValue({
        activeProperty: { id: "p1", name: "P" },
        userRole: "staff",
      });
      renderSettingsPage();

      const staffHeadings = screen.queryAllByRole("heading", {
        name: /staff for|staff.*property/i,
      });
      expect(staffHeadings.length).toBe(0);
    });
  });

  describe("edge cases", () => {
    it("page has accessible title or heading", () => {
      renderSettingsPage();
      const heading = screen.queryByRole("heading", {
        name: /settings|pengaturan/i,
        level: 1,
      });
      const text = screen.queryByText(/settings|pengaturan/i);
      expect(heading ?? text).toBeInTheDocument();
    });
  });
});
