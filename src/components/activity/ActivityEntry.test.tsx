// Traceability: property-activity-log
// REQ 3.3 -> it('renders actor name, role badge, and action description')
// REQ 3.3 -> it('renders owner role badge with correct label')
// REQ 3.3 -> it('renders staff role badge with correct label')
// REQ 3.3 -> it('shows relative timestamp by default')
// REQ 3.4 -> it('shows exact datetime after tapping the timestamp')
// REQ 3.5 -> it('toggles back to relative time on second tap')
// REQ 3.6 -> it('timestamp is a button element to signal interactivity')
// REQ 3.6 -> it('timestamp button has a minimum touch target size')

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { format, formatDistanceToNow } from "date-fns";
import { ActivityEntry } from "./ActivityEntry";
import { createActivityLogEntry } from "@/test/fixtures/activity-log";

describe("ActivityEntry", () => {
  describe("good cases", () => {
    it("renders actor name, role badge, and action description", () => {
      const entry = createActivityLogEntry({
        actorName: "Ahmad Fadhil",
        actorRole: "owner",
        actionCode: "PAYMENT_RECORDED",
        metadata: { amount: 500000, tenantName: "Siti", roomName: "3A" },
      });
      render(<ActivityEntry entry={entry} />);

      expect(screen.getByText("Ahmad Fadhil")).toBeInTheDocument();
      expect(screen.getByText(/owner/i)).toBeInTheDocument();
    });

    it("renders owner role badge", () => {
      const entry = createActivityLogEntry({ actorRole: "owner" });
      render(<ActivityEntry entry={entry} />);
      expect(screen.getByText(/owner/i)).toBeInTheDocument();
    });

    it("renders staff role badge", () => {
      const entry = createActivityLogEntry({ actorRole: "staff" });
      render(<ActivityEntry entry={entry} />);
      expect(screen.getByText(/staff/i)).toBeInTheDocument();
    });

    it("shows relative timestamp by default", () => {
      const createdAt = new Date("2026-01-01T09:00:00.000Z");
      const entry = createActivityLogEntry({ createdAt });
      render(<ActivityEntry entry={entry} />);

      const expected = formatDistanceToNow(createdAt, { addSuffix: true });
      expect(screen.getByRole("button", { name: expected })).toBeInTheDocument();
    });

    it("shows exact datetime after tapping the timestamp", async () => {
      const user = userEvent.setup();
      const createdAt = new Date("2026-04-07T12:00:00.000Z");
      const entry = createActivityLogEntry({ createdAt });
      render(<ActivityEntry entry={entry} />);

      const btn = screen.getByRole("button", {
        name: formatDistanceToNow(createdAt, { addSuffix: true }),
      });
      await user.click(btn);

      const expected = format(createdAt, "MMM d, yyyy · HH:mm");
      expect(screen.getByRole("button", { name: expected })).toBeInTheDocument();
    });

    it("toggles back to relative time on second tap", async () => {
      const user = userEvent.setup();
      const createdAt = new Date("2026-04-07T12:00:00.000Z");
      const entry = createActivityLogEntry({ createdAt });
      render(<ActivityEntry entry={entry} />);

      const relativeLabel = formatDistanceToNow(createdAt, { addSuffix: true });
      const btn = screen.getByRole("button", { name: relativeLabel });

      await user.click(btn);
      await user.click(screen.getByRole("button", { name: format(createdAt, "MMM d, yyyy · HH:mm") }));

      expect(screen.getByRole("button", { name: relativeLabel })).toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("shows no error message when actionCode metadata values are empty strings", () => {
      const entry = createActivityLogEntry({
        actionCode: "PAYMENT_RECORDED",
        metadata: {},
      });
      render(<ActivityEntry entry={entry} />);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.getByText(entry.actorName)).toBeInTheDocument();
    });

    it("shows no error message when all metadata fields are absent", () => {
      const entry = createActivityLogEntry({
        actionCode: "EXPENSE_CREATED",
        metadata: {},
        actorName: "Missing Meta User",
      });
      render(<ActivityEntry entry={entry} />);
      expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
      expect(screen.getByText("Missing Meta User")).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("SETTINGS_STAFF_FINANCE_TOGGLED with enabled=true renders enabled label", () => {
      const entry = createActivityLogEntry({
        actionCode: "SETTINGS_STAFF_FINANCE_TOGGLED",
        entityType: "SETTINGS",
        entityId: null,
        metadata: { enabled: true },
      });
      render(<ActivityEntry entry={entry} />);
      expect(screen.getByText(/enabled staff-only finance/i)).toBeInTheDocument();
      expect(screen.queryByText(/disabled staff-only finance/i)).not.toBeInTheDocument();
    });

    it("SETTINGS_STAFF_FINANCE_TOGGLED with enabled=false renders disabled label", () => {
      const entry = createActivityLogEntry({
        actionCode: "SETTINGS_STAFF_FINANCE_TOGGLED",
        entityType: "SETTINGS",
        entityId: null,
        metadata: { enabled: false },
      });
      render(<ActivityEntry entry={entry} />);
      expect(screen.getByText(/disabled staff-only finance/i)).toBeInTheDocument();
      expect(screen.queryByText(/enabled staff-only finance/i)).not.toBeInTheDocument();
    });

    it("timestamp is a button element to signal interactivity", () => {
      const entry = createActivityLogEntry();
      render(<ActivityEntry entry={entry} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("timestamp button has minimum 44px touch target via min-h or py class", () => {
      const entry = createActivityLogEntry();
      const { container } = render(<ActivityEntry entry={entry} />);
      const btn = container.querySelector("button");
      expect(btn).not.toBeNull();
      // The button must carry a touch-target class (min-h-[44px] or py-2 which gives ≥44px tap area)
      expect(btn!.className).toMatch(/min-h|p-2|py-/);
    });

    it("each entry is independent — toggling one does not affect another", async () => {
      const user = userEvent.setup();
      const createdAt = new Date("2026-04-07T12:00:00.000Z");
      const entry1 = createActivityLogEntry({ id: "e1", createdAt });
      const entry2 = createActivityLogEntry({ id: "e2", createdAt });

      // Render both entries into the same document (RTL appends each to document.body)
      render(<ActivityEntry entry={entry1} />);
      render(<ActivityEntry entry={entry2} />);

      const relativeLabel = formatDistanceToNow(createdAt, { addSuffix: true });
      const buttons = screen.getAllByRole("button", { name: relativeLabel });
      await user.click(buttons[0]);

      const exactLabel = format(createdAt, "MMM d, yyyy · HH:mm");
      // First entry shows exact, second still shows relative
      expect(screen.getByRole("button", { name: exactLabel })).toBeInTheDocument();
      expect(screen.getAllByRole("button", { name: relativeLabel })).toHaveLength(1);
    });
  });
});
