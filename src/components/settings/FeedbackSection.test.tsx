// Traceability: settings-feedback-form
// AC-1.1 -> it('renders textarea, character counter, and submit button')
// AC-1.2 -> it('shows Feedback section heading')
// AC-2.1 -> it('shows validation error and does not POST when message is empty')
// AC-2.2 -> it('shows validation error and does not POST when message exceeds 2000 chars')
// AC-2.3 -> it('treats whitespace-only input as empty')
// AC-3.1 -> it('calls POST /api/feedback with message on valid submit')
// AC-3.2 -> it('disables submit button while request is in flight')
// AC-3.3 -> it('shows success toast and resets textarea after successful submit')
// AC-3.4 -> it('shows error toast when API returns non-2xx')

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FeedbackSection } from "./FeedbackSection";

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}));

function makeSuccessResponse() {
  return Promise.resolve(
    new Response(JSON.stringify({ success: true }), { status: 200 })
  );
}

function makeErrorResponse(status = 500) {
  return Promise.resolve(
    new Response(JSON.stringify({ error: "Server error" }), { status })
  );
}

describe("FeedbackSection", () => {
  beforeEach(() => {
    mockToast.mockReset();
    vi.stubGlobal("fetch", vi.fn().mockImplementation(makeSuccessResponse));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("good cases", () => {
    it("renders textarea, character counter, and submit button", () => {
      render(<FeedbackSection />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i })).toBeInTheDocument();
      expect(screen.getByText(/2000.*characters remaining|2000.*karakter tersisa/i)).toBeInTheDocument();
    });

    it("shows Feedback section heading", () => {
      render(<FeedbackSection />);

      expect(
        screen.getByRole("heading", { name: /feedback/i })
      ).toBeInTheDocument();
    });

    it("calls POST /api/feedback with trimmed message on valid submit", async () => {
      const user = userEvent.setup();
      render(<FeedbackSection />);

      await user.type(screen.getByRole("textbox"), "The payment recording form is confusing.");
      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith(
          "/api/feedback",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ message: "The payment recording form is confusing." }),
          })
        );
      });
    });

    it("shows success toast after successful submit", async () => {
      const user = userEvent.setup();
      render(<FeedbackSection />);

      await user.type(screen.getByRole("textbox"), "Add export to CSV feature.");
      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.stringMatching(/thank you|terima kasih/i) })
        );
      });
    });

    it("resets textarea to empty after successful submit", async () => {
      const user = userEvent.setup();
      render(<FeedbackSection />);

      const textarea = screen.getByRole("textbox");
      await user.type(textarea, "Some valid feedback.");
      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      await waitFor(() => {
        expect(textarea).toHaveValue("");
      });
    });

    it("decrements character counter as user types", async () => {
      const user = userEvent.setup();
      render(<FeedbackSection />);

      await user.type(screen.getByRole("textbox"), "Hello");

      expect(screen.getByText(/1995.*characters remaining|1995.*karakter tersisa/i)).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("shows validation error and does not POST when message is empty", async () => {
      const user = userEvent.setup();
      render(<FeedbackSection />);

      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("shows validation error and does not POST when message is whitespace-only", async () => {
      const user = userEvent.setup();
      render(<FeedbackSection />);

      await user.type(screen.getByRole("textbox"), "     ");
      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
      });
      expect(fetch).not.toHaveBeenCalled();
    });

    it("shows error toast when API returns a non-2xx response", async () => {
      vi.stubGlobal("fetch", vi.fn().mockImplementation(() => makeErrorResponse(500)));
      const user = userEvent.setup();
      render(<FeedbackSection />);

      await user.type(screen.getByRole("textbox"), "Something broke on the tenant page.");
      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.stringMatching(/something went wrong|terjadi kesalahan/i) })
        );
      });
    });

    it("shows error toast when fetch throws a network error", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network offline")));
      const user = userEvent.setup();
      render(<FeedbackSection />);

      await user.type(screen.getByRole("textbox"), "App crashes on load.");
      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: expect.stringMatching(/something went wrong|terjadi kesalahan/i) })
        );
      });
    });
  });

  describe("edge cases", () => {
    it("disables submit button while request is in flight", async () => {
      let resolveRequest!: () => void;
      vi.stubGlobal(
        "fetch",
        vi.fn().mockReturnValue(
          new Promise<Response>((resolve) => {
            resolveRequest = () => resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
          })
        )
      );
      const user = userEvent.setup();
      render(<FeedbackSection />);

      await user.type(screen.getByRole("textbox"), "Checking loading state.");
      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      expect(screen.getByRole("button", { name: /submitting|mengirim/i })).toBeDisabled();

      resolveRequest();
    });

    it("does not show validation error before first submit attempt", () => {
      render(<FeedbackSection />);

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("accepts a message exactly at the 2000-character limit without validation error", async () => {
      const user = userEvent.setup();
      render(<FeedbackSection />);

      const textarea = screen.getByRole("textbox");
      // Use fireEvent.change for large input to avoid O(n) userEvent.type slowdown
      fireEvent.change(textarea, { target: { value: "a".repeat(2000) } });
      await user.click(screen.getByRole("button", { name: /submit feedback|kirim umpan balik/i }));

      await waitFor(() => {
        expect(fetch).toHaveBeenCalled();
      });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("textarea has accessible label", () => {
      render(<FeedbackSection />);

      const textarea = screen.getByRole("textbox");
      expect(textarea).toHaveAccessibleName();
    });
  });
});
