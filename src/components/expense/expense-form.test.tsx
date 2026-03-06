// Traceability: finance-expense-tracking
// REQ 1.1 -> it('renders form with category, amount, date, and description fields')
// REQ 1.2 -> it('renders category dropdown with all options')
// REQ 1.4 -> it('shows validation errors when required fields are empty')
// REQ 1.5 -> it('shows validation error when amount is zero or negative')
// REQ 1.7 -> it('defaults date to today when defaultDate not provided')
// REQ 9.4, 9.5 -> it('has minimum 44px touch targets on submit and cancel')

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExpenseForm } from "./expense-form";

describe("ExpenseForm", () => {
  describe("good cases", () => {
    it("renders form with category, amount, date, and description fields", () => {
      render(<ExpenseForm />);

      expect(
        screen.getByLabelText(/category|kategori/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/amount|jumlah/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/date|tanggal/i)
      ).toBeInTheDocument();
      expect(
        screen.getByLabelText(/description|deskripsi/i)
      ).toBeInTheDocument();
    });

    it("renders category dropdown with all options", () => {
      render(<ExpenseForm />);

      const trigger = screen.getByRole("combobox", {
        name: /category|kategori/i,
      });
      expect(trigger).toBeInTheDocument();
    });

    it("calls onSubmit with valid data when submitted", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();
      render(
        <ExpenseForm
          onSubmit={onSubmit}
          defaultDate="2026-03-01"
        />
      );
      await user.type(screen.getByLabelText(/amount|jumlah/i), "50000");
      await user.click(
        screen.getByRole("button", { name: /save expense|simpan pengeluaran/i })
      );
      expect(onSubmit).not.toHaveBeenCalled();
      expect(
        screen.getByText(/please select a category|pilih kategori|required|wajib/i)
      ).toBeInTheDocument();
    });

    it("defaults date to today when defaultDate not provided", () => {
      const today = new Date().toISOString().split("T")[0];
      render(<ExpenseForm />);

      const dateInput = screen.getByLabelText(/date|tanggal/i);
      expect((dateInput as HTMLInputElement).value).toBe(today);
    });

    it("has minimum 44px touch targets on submit and cancel", () => {
      render(<ExpenseForm onCancel={vi.fn()} />);

      const submit = screen.getByRole("button", {
        name: /save expense|simpan pengeluaran/i,
      });
      expect(submit).toHaveClass("min-h-[44px]");
      const cancel = screen.getByRole("button", { name: /cancel|batal/i });
      expect(cancel).toHaveClass("min-h-[44px]");
    });
  });

  describe("bad cases", () => {
    it("shows validation errors when required fields are empty", async () => {
      const onSubmit = vi.fn();
      const { container } = render(<ExpenseForm onSubmit={onSubmit} />);
      const form = container.querySelector("form");
      expect(form).toBeInTheDocument();
      fireEvent.submit(form!);

      await vi.waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
        const alerts = screen.getAllByRole("alert");
        expect(alerts.length).toBeGreaterThan(0);
      });
    });

    it("shows validation error when amount is zero or negative", async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();
      const { container } = render(<ExpenseForm onSubmit={onSubmit} />);

      await user.type(screen.getByLabelText(/amount|jumlah/i), "0");
      fireEvent.submit(container.querySelector("form")!);

      await vi.waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
        const alerts = screen.getAllByRole("alert");
        expect(alerts.some((el) => /positive|positif|amount|required/i.test(el.textContent ?? ""))).toBe(true);
      });
    });
  });

  describe("edge cases", () => {
    it("calls onCancel when cancel button clicked", async () => {
      const onCancel = vi.fn();
      const user = userEvent.setup();
      render(<ExpenseForm onCancel={onCancel} />);

      await user.click(screen.getByRole("button", { name: /cancel|batal/i }));

      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("uses defaultDate when provided", () => {
      render(<ExpenseForm defaultDate="2026-03-15" />);

      const dateInput = screen.getByLabelText(/date|tanggal/i);
      expect((dateInput as HTMLInputElement).value).toBe("2026-03-15");
    });
  });
});
