// Traceability: multi-property-management, property-currency (Issue #93)
// REQ 1.1 -> it('renders form with property name, address, and currency fields')
// REQ 1.3 -> it('shows validation errors when required fields are empty')
// REQ 8.2 -> it('displays form fields in vertical stack')

import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyForm } from "./property-form";

// Radix UI Select uses Pointer Events API and scrollIntoView which JSDOM doesn't implement
beforeAll(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false) as unknown as typeof Element.prototype.hasPointerCapture;
  Element.prototype.setPointerCapture = vi.fn() as unknown as typeof Element.prototype.setPointerCapture;
  Element.prototype.releasePointerCapture = vi.fn() as unknown as typeof Element.prototype.releasePointerCapture;
  Element.prototype.scrollIntoView = vi.fn() as unknown as typeof Element.prototype.scrollIntoView;
});

vi.mock("@/contexts/currency-context", () => ({
  useCurrency: vi.fn().mockReturnValue({
    code: null,
    locale: null,
    availableCurrencies: [
      { code: "EUR", locale: "en-IE", label: "Euro", id: "1", createdAt: new Date() },
      { code: "IDR", locale: "id-ID", label: "Indonesian Rupiah", id: "2", createdAt: new Date() },
    ],
    isLoading: false,
  }),
}));

describe("PropertyForm", () => {
  describe("good cases", () => {
    it("renders form with property name, address, and currency fields", () => {
      render(<PropertyForm />);

      expect(screen.getByLabelText(/property name|name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/address/i)).toBeInTheDocument();
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<PropertyForm />);

      expect(
        screen.getByRole("button", { name: /create property|save|submit/i })
      ).toBeInTheDocument();
    });

    it("calls onSubmit with name, address, and currency when all fields are filled", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<PropertyForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/property name|name/i), "My Kost");
      await user.type(screen.getByLabelText(/address/i), "Jl. Example 1");

      // Open the currency select and choose Euro
      await user.click(screen.getByRole("combobox"));
      const euroOption = await screen.findByRole("option", { name: /euro/i });
      await user.click(euroOption);

      await user.click(
        screen.getByRole("button", { name: /create property|save|submit/i })
      );

      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: "My Kost", address: "Jl. Example 1", currency: "EUR" })
      );
    });

    it("does not render currency selector in edit mode", () => {
      render(<PropertyForm mode="edit" />);

      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("shows validation errors when required fields are empty", async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);

      await user.click(
        screen.getByRole("button", { name: /create property|save|submit/i })
      );

      expect(screen.getByText(/Property name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/Address is required/i)).toBeInTheDocument();
    });

    it("shows currency validation error when no currency is selected", async () => {
      const user = userEvent.setup();
      render(<PropertyForm />);

      await user.type(screen.getByLabelText(/property name|name/i), "My Kost");
      await user.type(screen.getByLabelText(/address/i), "Jl. Example 1");
      await user.click(
        screen.getByRole("button", { name: /create property|save|submit/i })
      );

      expect(screen.getByText(/currency is required/i)).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("displays form fields in vertical stack", () => {
      const { container } = render(<PropertyForm />);

      const form = container.querySelector("form");
      expect(form).toHaveClass("flex", "flex-col");
    });

    it("renders in edit mode with edit title and no currency field", () => {
      render(<PropertyForm mode="edit" />);

      expect(
        screen.getByRole("heading", { name: /edit|save changes/i })
      ).toBeInTheDocument();
      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    });
  });
});
