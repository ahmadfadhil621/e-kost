// Traceability: settings-dark-mode (issue #67)
// REQ AC-2 -> it('renders three theme options: Light, Dark, System')
// REQ AC-2 -> it('marks the active theme option with aria-pressed="true"')
// REQ AC-2 -> it('calls setTheme when a different option is selected')
// REQ AC-2 -> it('each option meets 44×44px touch target minimum')
// REQ AC-5 -> it('section has an accessible heading')
// REQ AC-5 -> it('active option is indicated with aria-pressed')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppearanceSection } from "./AppearanceSection";

const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => mockUseTheme(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

beforeEach(() => {
  mockSetTheme.mockClear();
  mockUseTheme.mockReturnValue({
    theme: "system",
    setTheme: mockSetTheme,
    resolvedTheme: "light",
  });
});

describe("AppearanceSection", () => {
  describe("good cases", () => {
    it("renders three theme options: Light, Dark, System", () => {
      render(<AppearanceSection />);

      expect(screen.getByRole("button", { name: /light|settings\.appearance\.light/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /dark|settings\.appearance\.dark/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /system|settings\.appearance\.system/i })).toBeInTheDocument();
    });

    it("marks the currently active theme option with aria-pressed='true'", () => {
      mockUseTheme.mockReturnValue({ theme: "dark", setTheme: mockSetTheme, resolvedTheme: "dark" });
      render(<AppearanceSection />);

      const pressedButtons = screen.getAllByRole("button", { pressed: true });
      expect(pressedButtons).toHaveLength(1);
      expect(pressedButtons[0]).toHaveAccessibleName(/dark|settings\.appearance\.dark/i);
    });

    it("calls setTheme with 'light' when Light option is clicked", async () => {
      const user = userEvent.setup();
      render(<AppearanceSection />);

      await user.click(screen.getByRole("button", { name: /light|settings\.appearance\.light/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("calls setTheme with 'dark' when Dark option is clicked", async () => {
      const user = userEvent.setup();
      render(<AppearanceSection />);

      await user.click(screen.getByRole("button", { name: /dark|settings\.appearance\.dark/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("dark");
    });

    it("calls setTheme with 'system' when System option is clicked", async () => {
      mockUseTheme.mockReturnValue({ theme: "dark", setTheme: mockSetTheme, resolvedTheme: "dark" });
      const user = userEvent.setup();
      render(<AppearanceSection />);

      await user.click(screen.getByRole("button", { name: /system|settings\.appearance\.system/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("system");
    });

    it("section has an accessible heading for Appearance", () => {
      render(<AppearanceSection />);

      expect(
        screen.getByRole("heading", { name: /appearance|settings\.appearance/i })
      ).toBeInTheDocument();
    });

    it("each option button meets 44×44px touch target minimum", () => {
      render(<AppearanceSection />);

      screen.getAllByRole("button").forEach((btn) => {
        expect(btn.className).toMatch(/min-h-\[44px\]/);
      });
    });
  });

  describe("bad cases", () => {
    it("renders without crashing when theme is undefined", () => {
      mockUseTheme.mockReturnValue({ theme: undefined, setTheme: mockSetTheme, resolvedTheme: undefined });

      expect(() => render(<AppearanceSection />)).not.toThrow();
    });

    it("does not mark any button pressed when theme is undefined", () => {
      mockUseTheme.mockReturnValue({ theme: undefined, setTheme: mockSetTheme, resolvedTheme: undefined });
      render(<AppearanceSection />);

      const pressedButtons = screen.queryAllByRole("button", { pressed: true });
      expect(pressedButtons).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("marks system button pressed when theme is 'system'", () => {
      mockUseTheme.mockReturnValue({ theme: "system", setTheme: mockSetTheme, resolvedTheme: "light" });
      render(<AppearanceSection />);

      const pressedButtons = screen.getAllByRole("button", { pressed: true });
      expect(pressedButtons).toHaveLength(1);
      expect(pressedButtons[0]).toHaveAccessibleName(/system|settings\.appearance\.system/i);
    });

    it("clicking already-active theme still calls setTheme (no-op guard is in next-themes)", async () => {
      mockUseTheme.mockReturnValue({ theme: "light", setTheme: mockSetTheme, resolvedTheme: "light" });
      const user = userEvent.setup();
      render(<AppearanceSection />);

      await user.click(screen.getByRole("button", { name: /light|settings\.appearance\.light/i }));

      expect(mockSetTheme).toHaveBeenCalledWith("light");
    });

    it("only one button has aria-pressed='true' at a time", () => {
      mockUseTheme.mockReturnValue({ theme: "light", setTheme: mockSetTheme, resolvedTheme: "light" });
      render(<AppearanceSection />);

      const pressedButtons = screen.getAllByRole("button", { pressed: true });
      expect(pressedButtons).toHaveLength(1);
    });
  });
});
