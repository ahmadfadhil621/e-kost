// Traceability: settings-language-persistence
// REQ 4.1 -> it('calls PATCH /api/user/language when authenticated user selects a language')
// REQ 4.2 -> it('does not call PATCH API when user is unauthenticated')
// REQ 4.1 -> it('calls i18n.changeLanguage and persists to localStorage when language is selected')
// REQ 5.1 -> it('does not call PATCH API when user is unauthenticated')
// REQ 5.3 -> it('updates UI immediately without waiting for API response')
// PROP 1  -> (E2E: language-persistence.spec.ts)
// PROP 2  -> it('does not call PATCH API when user is unauthenticated')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSelector } from "./LanguageSelector";

const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
const mockGetItem = vi.fn();
const mockSetItem = vi.fn();
const mockFetch = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

const { useAuth } = await import("@/hooks/use-auth");

const authenticatedReturn = {
  user: { id: "user-1", name: "Test User", email: "test@example.com" },
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

const unauthenticatedReturn = {
  user: null,
  loading: false,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  });
  vi.stubGlobal("fetch", mockFetch);
  mockGetItem.mockReturnValue(null);
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({}) });
  vi.mocked(useAuth).mockReturnValue(unauthenticatedReturn);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("LanguageSelector", () => {
  describe("good cases", () => {
    it("displays language section with all available locales and current language indicated", () => {
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      expect(
        screen.getByRole("heading", { name: /language|settings\.language\.title/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /english|en/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /indonesian|bahasa|id/i })
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
    });

    it("calls i18n.changeLanguage and persists to localStorage when language is selected", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      await user.click(screen.getByRole("button", { name: /indonesian|bahasa|id/i }));

      expect(mockChangeLanguage).toHaveBeenCalledWith("id");
      expect(mockSetItem).toHaveBeenCalled();
    });

    it("shows current language from i18n", () => {
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
    });

    it("each language option has minimum 44x44px touch target", () => {
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      screen.getAllByRole("button").forEach((btn) => {
        expect(btn.className).toMatch(/min-h-\[44px\]/);
        expect(btn.className).toMatch(/min-w-\[44px\]/);
      });
    });

    it("calls PATCH /api/user/language when authenticated user selects a language", async () => {
      vi.mocked(useAuth).mockReturnValue(authenticatedReturn);
      const user = userEvent.setup();
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      await user.click(screen.getByRole("button", { name: /indonesian|bahasa|id/i }));

      expect(mockFetch).toHaveBeenCalledWith(
        "/api/user/language",
        expect.objectContaining({
          method: "PATCH",
          body: expect.stringContaining('"id"'),
        })
      );
    });

    it("does not call PATCH API when user is unauthenticated", async () => {
      vi.mocked(useAuth).mockReturnValue(unauthenticatedReturn);
      const user = userEvent.setup();
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      await user.click(screen.getByRole("button", { name: /indonesian|bahasa|id/i }));

      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("bad cases", () => {
    it("renders without crashing when availableLocales is empty", () => {
      const { container } = render(<LanguageSelector availableLocales={[]} />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("persists selected language to localStorage with expected key", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      await user.click(screen.getByRole("button", { name: /indonesian|bahasa|id/i }));

      expect(mockSetItem).toHaveBeenCalledWith(
        expect.stringMatching(/language|ekost/i),
        "id"
      );
    });

    it("displays section header for language", () => {
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      expect(
        screen.getByRole("heading", { name: /language|settings\.language\.title/i })
      ).toBeInTheDocument();
    });

    it("updates UI immediately without waiting for API response (fire-and-forget)", async () => {
      vi.mocked(useAuth).mockReturnValue(authenticatedReturn);
      // Simulate a very slow API response
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve({ ok: true, json: async () => ({}) }),
              5000
            )
          )
      );
      const user = userEvent.setup();
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      await user.click(screen.getByRole("button", { name: /indonesian|bahasa|id/i }));

      // changeLanguage must be called immediately, before the fetch resolves
      expect(mockChangeLanguage).toHaveBeenCalledWith("id");
    });
  });
});
