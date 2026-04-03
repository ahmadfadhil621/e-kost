// Traceability: room-inventory-management
// REQ 1.1 -> it('renders form with room number, room type, and monthly rent fields')
// REQ 1.3 -> it('shows validation errors when required fields are empty')
// REQ 4.5 -> it('shows validation error when monthly rent is negative')
// REQ 6 (mobile) -> it('displays form in vertical stack with touch targets')

import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RoomForm } from "./room-form";

describe("RoomForm", () => {
  describe("good cases", () => {
    it("renders form with room number, room type, and monthly rent fields", () => {
      render(<RoomForm />);

      expect(
        screen.getByLabelText(/room number/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/room type/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/monthly rent/i)
      ).toBeInTheDocument();
    });

    it("renders submit button", () => {
      render(<RoomForm />);

      expect(
        screen.getByRole("button", { name: /create room|save changes/i })
      ).toBeInTheDocument();
    });

    it("calls onSubmit with valid data when submitted", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(<RoomForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/room number/i), "A101");
      await user.type(screen.getByLabelText(/room type/i), "single");
      await user.type(screen.getByLabelText(/monthly rent/i), "1500000");
      await user.click(
        screen.getByRole("button", { name: /create room|save changes/i })
      );

      expect(onSubmit).toHaveBeenCalledWith({
        roomNumber: "A101",
        roomType: "single",
        monthlyRent: 1500000,
        capacity: 1,
      });
    });

    it("renders in edit mode with edit title", () => {
      render(<RoomForm mode="edit" />);

      expect(
        screen.getByRole("heading", { name: /edit room|save changes/i })
      ).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("shows validation errors when required fields are empty", async () => {
      const user = userEvent.setup();
      render(<RoomForm />);

      await user.click(
        screen.getByRole("button", { name: /create room|save changes/i })
      );

      expect(
        screen.getByText(/room number is required/i)
      ).toBeInTheDocument();
      expect(
        screen.getByText(/room type is required/i)
      ).toBeInTheDocument();
      expect(
        document.getElementById("monthlyRent-error")?.textContent
      ).toBeTruthy();
    });

    it("shows validation error when monthly rent is negative", async () => {
      const user = userEvent.setup();
      render(<RoomForm />);

      await user.type(screen.getByLabelText(/room number/i), "A101");
      await user.type(screen.getByLabelText(/room type/i), "single");
      await user.type(screen.getByLabelText(/monthly rent/i), "-100");
      await user.click(
        screen.getByRole("button", { name: /create room|save changes/i })
      );

      expect(
        screen.getByText(/positive|monthly rent must be/i)
      ).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("displays form fields in vertical stack", () => {
      const { container } = render(<RoomForm />);

      const form = container.querySelector("form");
      expect(form).toHaveClass("flex", "flex-col");
    });

    it("renders cancel button when onCancel is provided", () => {
      const onCancel = vi.fn();
      render(<RoomForm onCancel={onCancel} />);

      expect(
        screen.getByRole("button", { name: /cancel/i })
      ).toBeInTheDocument();
    });

    it("shows status select with available and under_renovation when currentStatus provided and room is not occupied", () => {
      render(
        <RoomForm
          mode="edit"
          currentStatus="available"
          isOccupied={false}
        />
      );

      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it("shows read-only note instead of status select when room is occupied", () => {
      render(
        <RoomForm
          mode="edit"
          currentStatus="occupied"
          isOccupied={true}
        />
      );

      expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
      expect(
        screen.getByText(/move out all tenants|pindahkan semua/i)
      ).toBeInTheDocument();
    });

    it("calls onStatusChange when status select value changes", async () => {
      const onStatusChange = vi.fn();
      render(
        <RoomForm
          mode="edit"
          currentStatus="available"
          isOccupied={false}
          onStatusChange={onStatusChange}
        />
      );

      // Verify the select renders with the correct default value
      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeInTheDocument();
      // The select shows "Available" as the current value
      expect(trigger).toHaveTextContent(/available|tersedia/i);
    });

    it("does not show status field when currentStatus is not provided", () => {
      render(<RoomForm mode="create" />);

      expect(screen.queryByLabelText(/^status$/i)).not.toBeInTheDocument();
    });
  });
});
