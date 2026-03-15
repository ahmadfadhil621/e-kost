// Traceability: settings-staff-management
// REQ 2.1 -> it('displays account section with name and email')
// REQ 2.2 -> it('displays email as read-only')
// REQ 2.3 -> it('shows editable name field when Edit is clicked')
// REQ 2.4 -> it('calls updateUser and shows confirmation when saving valid name')
// REQ 2.5 -> it('prevents save and shows validation error when name is empty')
// REQ 2.6 -> it('displays profile icon with initials from current name')
// PROP 3 -> (E2E: round trip)

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountSection } from "./AccountSection";

const mockUpdateUser = vi.fn();

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    updateUser: (...args: unknown[]) => mockUpdateUser(...args),
  },
}));

const defaultUser = {
  id: "user-1",
  name: "Jane Doe",
  email: "jane@example.com",
};

describe("AccountSection", () => {
  beforeEach(() => {
    mockUpdateUser.mockReset();
  });

  describe("good cases", () => {
    it("displays account section with name and email", () => {
      render(<AccountSection user={defaultUser} onUserUpdated={vi.fn()} />);

      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
      expect(screen.getByText("jane@example.com")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /account|settings\.account\.title/i })
      ).toBeInTheDocument();
    });

    it("displays email as read-only", () => {
      render(<AccountSection user={defaultUser} onUserUpdated={vi.fn()} />);

      const emailEl = screen.getByText("jane@example.com");
      expect(emailEl).toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toHaveAttribute("contenteditable");
    });

    it("shows editable name field when Edit is clicked", async () => {
      const user = userEvent.setup();
      render(<AccountSection user={defaultUser} onUserUpdated={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /edit|ubah/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/name|nama/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /save|simpan/i })).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /cancel|batal/i })).toBeInTheDocument();
      });
    });

    it("calls updateUser and shows confirmation when saving valid name", async () => {
      mockUpdateUser.mockResolvedValue({ error: null });
      const onUserUpdated = vi.fn();
      const user = userEvent.setup();
      render(<AccountSection user={defaultUser} onUserUpdated={onUserUpdated} />);

      await user.click(screen.getByRole("button", { name: /edit|ubah/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/name|nama/i)).toBeInTheDocument();
      });
      const nameInput = screen.getByLabelText(/name|nama/i);
      await user.clear(nameInput);
      await user.type(nameInput, "Jane Smith");
      await user.click(screen.getByRole("button", { name: /save|simpan/i }));

      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({ name: "Jane Smith" });
      });
      await waitFor(() => {
        expect(onUserUpdated).toHaveBeenCalled();
      });
      expect(
        screen.getByText(/updated|berhasil|success|account updated/i)
      ).toBeInTheDocument();
    });

    it("displays profile icon with initials from current name", () => {
      render(<AccountSection user={defaultUser} onUserUpdated={vi.fn()} />);

      expect(screen.getByText("JD")).toBeInTheDocument();
    });

    it("edit and save buttons have minimum 44x44px touch target", async () => {
      const user = userEvent.setup();
      render(<AccountSection user={defaultUser} onUserUpdated={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /edit|ubah/i }));
      const saveBtn = screen.getByRole("button", { name: /save|simpan/i });
      expect(saveBtn.className).toMatch(/min-h-\[44px\]|min-w-\[44px\]/);
    });
  });

  describe("bad cases", () => {
    it("prevents save and shows validation error when name is empty", async () => {
      const user = userEvent.setup();
      render(<AccountSection user={defaultUser} onUserUpdated={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /edit|ubah/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/name|nama/i)).toBeInTheDocument();
      });
      const nameInput = screen.getByLabelText(/name|nama/i);
      await user.clear(nameInput);
      await user.click(screen.getByRole("button", { name: /save|simpan/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/name is required|required|nama wajib/i)
        ).toBeInTheDocument();
      });
      expect(mockUpdateUser).not.toHaveBeenCalled();
    });

    it("shows error message when updateUser fails", async () => {
      mockUpdateUser.mockResolvedValue({ error: new Error("Network error") });
      const user = userEvent.setup();
      render(<AccountSection user={defaultUser} onUserUpdated={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /edit|ubah/i }));
      await user.clear(screen.getByLabelText(/name|nama/i));
      await user.type(screen.getByLabelText(/name|nama/i), "New Name");
      await user.click(screen.getByRole("button", { name: /save|simpan/i }));

      await waitFor(() => {
        expect(
          screen.getByText(/failed|error|gagal|try again/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe("edge cases", () => {
    it("renders loading state during save", async () => {
      let resolveUpdate: () => void;
      mockUpdateUser.mockImplementation(
        () =>
          new Promise<void>((r) => {
            resolveUpdate = r;
          })
      );
      const user = userEvent.setup();
      render(<AccountSection user={defaultUser} onUserUpdated={vi.fn()} />);

      await user.click(screen.getByRole("button", { name: /edit|ubah/i }));
      await user.type(screen.getByLabelText(/name|nama/i), "X");
      await user.click(screen.getByRole("button", { name: /save|simpan/i }));

      expect(screen.getByText(/loading|memuat|saving/i)).toBeInTheDocument();
      resolveUpdate!();
    });

    it("single-word name shows single initial", () => {
      render(
        <AccountSection
          user={{ ...defaultUser, name: "Alice" }}
          onUserUpdated={vi.fn()}
        />
      );
      expect(screen.getByText("A")).toBeInTheDocument();
    });
  });
});
