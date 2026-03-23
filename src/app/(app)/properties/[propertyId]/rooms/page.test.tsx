// Traceability: rt-8-filter-search-lists
// REQ-4  -> it('searching by room number shows only matching room')
// REQ-4  -> it('searching by room type shows matching rooms')
// REQ-4  -> it('search and status filter compose (AND logic)')
// REQ-5  -> it('search with no match shows common.noResults')
// REQ-4  -> it('search is case-insensitive')
// REQ-4  -> it('clearing search after status filter restores all rooms for that status')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({
  useParams: () => ({ propertyId: "prop-1" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const ROOMS = [
  {
    id: "room-101",
    propertyId: "prop-1",
    roomNumber: "101",
    roomType: "single",
    monthlyRent: 1000000,
    status: "available" as const,
  },
  {
    id: "room-202",
    propertyId: "prop-1",
    roomNumber: "202",
    roomType: "double",
    monthlyRent: 1500000,
    status: "occupied" as const,
  },
  {
    id: "room-303",
    propertyId: "prop-1",
    roomNumber: "303",
    roomType: "single",
    monthlyRent: 1200000,
    status: "under_renovation" as const,
  },
];

let mockRoomsData = { rooms: ROOMS, count: ROOMS.length };

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const original = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...original,
    useQuery: vi.fn(() => ({
      data: mockRoomsData,
      isLoading: false,
      isError: false,
    })),
  };
});

import RoomListPage from "./page";

function renderPage() {
  return render(<RoomListPage />);
}

describe("RoomListPage — search", () => {
  beforeEach(() => {
    mockRoomsData = { rooms: ROOMS, count: ROOMS.length };
  });

  describe("good cases", () => {
    it("searching by room number shows only matching room", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "101");

      expect(await screen.findByText(/Room 101/i)).toBeInTheDocument();
      expect(screen.queryByText(/Room 202/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Room 303/i)).not.toBeInTheDocument();
    });

    it("searching by room type shows matching rooms", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "double");

      expect(await screen.findByText(/Room 202/i)).toBeInTheDocument();
      expect(screen.queryByText(/Room 101/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Room 303/i)).not.toBeInTheDocument();
    });

    it("search and status filter compose (AND logic)", async () => {
      const user = userEvent.setup();
      renderPage();

      // Select "Available" status filter
      await user.click(screen.getByRole("button", { name: /available/i }));
      await user.type(screen.getByRole("textbox"), "single");

      // Only room 101 (available + single) should be visible
      expect(await screen.findByText(/Room 101/i)).toBeInTheDocument();
      expect(screen.queryByText(/Room 202/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Room 303/i)).not.toBeInTheDocument();
    });
  });

  describe("bad cases", () => {
    it("search with no match shows common.noResults", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "xyz999");

      expect(await screen.findByText(/no results found/i)).toBeInTheDocument();
      expect(screen.queryByText(/no rooms found/i)).not.toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("search is case-insensitive", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.type(screen.getByRole("textbox"), "DOUBLE");

      expect(await screen.findByText(/Room 202/i)).toBeInTheDocument();
      expect(screen.queryByText(/Room 101/i)).not.toBeInTheDocument();
    });

    it("clearing search after status filter restores all rooms for that status", async () => {
      const user = userEvent.setup();
      renderPage();

      await user.click(screen.getByRole("button", { name: /available/i }));
      const input = screen.getByRole("textbox");
      await user.type(input, "101");

      expect(await screen.findByText(/Room 101/i)).toBeInTheDocument();
      expect(screen.queryByText(/Room 202/i)).not.toBeInTheDocument();

      await user.clear(input);

      // With status "available" still active, only room 101 should show
      expect(await screen.findByText(/Room 101/i)).toBeInTheDocument();
      expect(screen.queryByText(/Room 202/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Room 303/i)).not.toBeInTheDocument();
    });
  });
});
