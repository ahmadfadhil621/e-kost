// Traceability: settings-staff-management
// REQ 1.1 -> it('displays language section with all available locales and current language indicated')
// REQ 1.2 -> it('calls i18n.changeLanguage and persists to localStorage when language is selected')
// REQ 1.3 -> it('persists selected language to localStorage')
// REQ 1.5 -> it('shows current language from i18n when no persisted preference or default')
// REQ 4.3 -> it('displays section header for language')
// PROP 1 -> (E2E: all visible UI text updates)
// PROP 2 -> (E2E: persistence across reload)

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LanguageSelector } from "./LanguageSelector";

const mockChangeLanguage = vi.fn().mockResolvedValue(undefined);
const mockGetItem = vi.fn();
const mockSetItem = vi.fn();

beforeEach(() => {
  vi.stubGlobal("localStorage", {
    getItem: mockGetItem,
    setItem: mockSetItem,
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  });
  mockGetItem.mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: "en",
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

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
      const activeButton = screen.getByRole("button", { pressed: true });
      expect(activeButton).toBeInTheDocument();
    });

    it("calls i18n.changeLanguage and persists to localStorage when language is selected", async () => {
      const user = userEvent.setup();
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      const idButton = screen.getByRole("button", { name: /indonesian|bahasa|id/i });
      await user.click(idButton);

      expect(mockChangeLanguage).toHaveBeenCalledWith("id");
      expect(mockSetItem).toHaveBeenCalled();
    });

    it("shows current language from i18n when no persisted preference or default", () => {
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      expect(screen.getByRole("button", { pressed: true })).toBeInTheDocument();
    });

    it("each language option has minimum 44x44px touch target", () => {
      render(<LanguageSelector availableLocales={["en", "id"]} />);

      const buttons = screen.getAllByRole("button");
      buttons.forEach((btn) => {
        expect(btn.className).toMatch(/min-h-\[44px\]/);
        expect(btn.className).toMatch(/min-w-\[44px\]/);
      });
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
        screen.getByRole("heading", {
          name: /language|settings\.language\.title/i,
        })
      ).toBeInTheDocument();
    });
  });
});
