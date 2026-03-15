// Traceability: multi-property-management
// REQ 1.1 -> it('renders form with property name and address fields')
// REQ 1.3 -> it('shows validation errors when required fields are empty')
// REQ 8.2 -> it('displays form fields in vertical stack')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PropertyForm } from "./property-form";

describe("PropertyForm", () => {
  describe("good cases", () => {
    it("renders form with property name and address fields", () => {
      render(<PropertyForm />);

      expect(
        screen.getByLabelText(/property name|name/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/address/i)
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<PropertyForm />);

      expect(
        screen.getByRole("button", { name: /create property|save|submit/i })
      ).toBeInTheDocument();
    });

    it("calls onSubmit with valid data when submitted", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<PropertyForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/property name|name/i), "My Kost");
      await user.type(screen.getByLabelText(/address/i), "Jl. Example 1");
      await user.click(
        screen.getByRole("button", { name: /create property|save|submit/i })
      );

      expect(onSubmit).toHaveBeenCalledWith({
        name: "My Kost",
        address: "Jl. Example 1",
      });
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
  });

  describe("edge cases", () => {
    it("displays form fields in vertical stack", () => {
      const { container } = render(<PropertyForm />);

      const form = container.querySelector("form");
      expect(form).toHaveClass("flex", "flex-col");
    });

    it("renders in edit mode with edit title", () => {
      render(<PropertyForm mode="edit" />);

      expect(
        screen.getByRole("heading", { name: /edit|save changes/i })
      ).toBeInTheDocument();
    });
  });
});
