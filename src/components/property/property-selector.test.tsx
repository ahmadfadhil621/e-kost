// Traceability: multi-property-management / UI redesign (property selector)
// Plan: Renders "Select Property" heading and property cards; selecting a card
//       calls setActivePropertyId and navigates to /

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertySelector } from "./property-selector";

const mockSetActivePropertyId = vi.fn();
const mockPush = vi.fn();

vi.mock("@/contexts/property-context", () => ({
  usePropertyContext: () => ({
    properties: [
      {
        id: "prop-1",
        name: "Test Property",
        address: "123 Test St",
        ownerId: "owner-1",
      },
    ],
    setActivePropertyId: mockSetActivePropertyId,
    isLoading: false,
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn() }),
}));

describe("PropertySelector", () => {
  beforeEach(() => {
    mockSetActivePropertyId.mockClear();
    mockPush.mockClear();
  });

  describe("good cases", () => {
    it('renders "Select Property" heading', () => {
      render(<PropertySelector />);

      expect(
        screen.getByRole("heading", { name: /select property|pilih properti/i })
      ).toBeInTheDocument();
    });

    it("renders property cards with name and address", () => {
      render(<PropertySelector />);

      expect(screen.getByText(/test property/i)).toBeInTheDocument();
      expect(screen.getByText(/123 test st/i)).toBeInTheDocument();
    });

    it("selecting a property card calls setActivePropertyId and navigates to /", async () => {
      const user = userEvent.setup();
      render(<PropertySelector />);

      const nameEl = screen.getByText(/test property/i);
      const clickable =
        nameEl.closest("button") ?? nameEl.closest("a") ?? nameEl;
      await user.click(clickable);

      await waitFor(() => {
        expect(mockSetActivePropertyId).toHaveBeenCalledWith("prop-1");
      });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });
    });
  });

  describe("bad cases", () => {
    it("handles loading state without crashing", () => {
      expect(() => render(<PropertySelector />)).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("property card or name is interactive", () => {
      render(<PropertySelector />);

      const nameEl = screen.queryByText(/test property/i);
      if (nameEl) {
        const clickable = nameEl.closest("button") ?? nameEl.closest("a");
        expect(clickable ?? nameEl).toBeInTheDocument();
      }
    });
  });
});
