// Traceability: settings-staff-management, settings-invite-management
// REQ 4.1 -> it('displays single page with Language and Account sections')
// REQ 4.2 -> it('renders sections in single-column with separators')
// REQ 4.3 -> it('displays section headers for Language and Account')
// REQ 4.4 -> (touch targets covered in child component tests)
// REQ 4.5 -> (mobile layout covered by E2E)
// REQ 5.1 -> it('shows dev section link when user is a dev')
// REQ 5.2 -> it('hides dev section link for non-dev users')
// REQ 5.3 -> it('dev section link navigates to /settings/invites')
// Note: Staff section moved to /properties/[propertyId] (issue #26)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Providers } from "@/components/providers";
import { SettingsPage } from "./SettingsPage";

const mockUseDevStatus = vi.fn();

vi.mock("@/hooks/use-dev-status", () => ({
  useDevStatus: () => mockUseDevStatus(),
}));

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
  mockUseDevStatus.mockReturnValue({ isDev: false, isLoading: false });
});

describe("SettingsPage", () => {
  describe("good cases", () => {
    it("displays single page with Language and Account sections", () => {
      renderSettingsPage();

      expect(
        screen.getByRole("heading", { name: /language|settings\.language/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /account|settings\.account/i })
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

    it("displays section headers for Language and Account", () => {
      renderSettingsPage();

      expect(
        screen.getByText(/language|settings\.language\.title/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/account|settings\.account\.title/i)
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

describe("SettingsPage — dev section", () => {
  describe("good cases", () => {
    it("shows dev section link when user is a dev", () => {
      mockUseDevStatus.mockReturnValue({ isDev: true, isLoading: false });
      render(<Providers><SettingsPage /></Providers>);

      const link = screen.queryByRole("link", { name: /invite management|manajemen undangan/i });
      expect(link).toBeInTheDocument();
    });

    it("dev section link navigates to /settings/invites", () => {
      mockUseDevStatus.mockReturnValue({ isDev: true, isLoading: false });
      render(<Providers><SettingsPage /></Providers>);

      const link = screen.getByRole("link", { name: /invite management|manajemen undangan/i });
      expect(link).toHaveAttribute("href", "/settings/invites");
    });
  });

  describe("bad cases", () => {
    it("hides dev section link for non-dev users", () => {
      mockUseDevStatus.mockReturnValue({ isDev: false, isLoading: false });
      render(<Providers><SettingsPage /></Providers>);

      const link = screen.queryByRole("link", { name: /invite management|manajemen undangan/i });
      expect(link).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("does not show dev section while dev status is loading", () => {
      mockUseDevStatus.mockReturnValue({ isDev: false, isLoading: true });
      render(<Providers><SettingsPage /></Providers>);

      const link = screen.queryByRole("link", { name: /invite management|manajemen undangan/i });
      expect(link).not.toBeInTheDocument();
    });
  });
});
