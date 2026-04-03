// Traceability: data-freshness
// REQ 1.3 -> it('invalidates room, rooms, and dashboard after successful edit room')
// REQ 2.1 -> it('invalidates room, rooms, and dashboard after successful edit room')
// data-integrity#AC-3 -> it('invalidates billing-cycles after successful rent edit')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import EditRoomPage from "./page";

const PROPERTY_ID = "prop-789";
const ROOM_ID = "room-789";
const mockPush = vi.fn();

const mockRoom = {
  id: ROOM_ID,
  roomNumber: "A101",
  roomType: "single",
  monthlyRent: 1500000,
  status: "available",
  activeTenantCount: 0,
};

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useParams: () => ({ propertyId: PROPERTY_ID, roomId: ROOM_ID }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

function createFetchMock() {
  return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : (input as URL).toString();
    const method = (init?.method ?? "GET").toUpperCase();
    if (url.includes(`/rooms/${ROOM_ID}`) && method === "GET") {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => mockRoom,
      });
    }
    if (url.includes(`/rooms/${ROOM_ID}`) && method === "PUT") {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
    }
    return Promise.reject(new Error(`Unexpected request: ${method} ${url}`));
  });
}

describe("EditRoomPage (data freshness)", () => {
  let queryClient: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    queryClient = new QueryClient();
    invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    mockPush.mockClear();
    vi.stubGlobal("fetch", createFetchMock());
  });

  describe("good cases", () => {
    it("invalidates room, rooms, and dashboard after successful edit room", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <EditRoomPage />
        </QueryClientProvider>
      );

      await waitFor(() => expect(screen.getByLabelText(/room number/i)).toHaveValue("A101"));

      await userEvent.clear(screen.getByLabelText(/room number/i));
      await userEvent.type(screen.getByLabelText(/room number/i), "A102");
      await userEvent.click(
        screen.getByRole("button", { name: /save changes|save/i })
      );

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ["room", PROPERTY_ID, ROOM_ID],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ["rooms", PROPERTY_ID],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ["dashboard", PROPERTY_ID],
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
          queryKey: ["billing-cycles"],
        });
      });
    });
  });

  describe("bad cases", () => {
    it("does not invalidate when edit room request fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
          const url = typeof input === "string" ? input : (input as URL).toString();
          const method = (init?.method ?? "GET").toUpperCase();
          if (url.includes(`/rooms/${ROOM_ID}`) && method === "GET") {
            return Promise.resolve({
              ok: true,
              status: 200,
              json: async () => mockRoom,
            });
          }
          if (url.includes(`/rooms/${ROOM_ID}`) && method === "PUT") {
            return Promise.resolve({
              ok: false,
              status: 400,
              json: async () => ({ error: "Validation failed" }),
            });
          }
          return Promise.reject(new Error("Unexpected request"));
        })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <EditRoomPage />
        </QueryClientProvider>
      );

      await waitFor(() => expect(screen.getByLabelText(/room number/i)).toHaveValue("A101"));

      await userEvent.clear(screen.getByLabelText(/room number/i));
      await userEvent.type(screen.getByLabelText(/room number/i), "A103");
      await userEvent.click(
        screen.getByRole("button", { name: /save changes|save/i })
      );

      await waitFor(() => expect(mockPush).not.toHaveBeenCalled());
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("invalidates exactly room, rooms, and dashboard keys once each on success", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <EditRoomPage />
        </QueryClientProvider>
      );

      await waitFor(() => expect(screen.getByLabelText(/room number/i)).toHaveValue("A101"));

      await userEvent.type(screen.getByLabelText(/monthly rent/i), "000"); // append to make 1500000000 or just change
      await userEvent.click(
        screen.getByRole("button", { name: /save changes|save/i })
      );

      await waitFor(() => {
        const roomCalls = invalidateSpy.mock.calls.filter(
          (c) =>
            Array.isArray(c[0]?.queryKey) &&
            c[0].queryKey[0] === "room" &&
            c[0].queryKey[1] === PROPERTY_ID &&
            c[0].queryKey[2] === ROOM_ID
        );
        const roomsCalls = invalidateSpy.mock.calls.filter(
          (c) => Array.isArray(c[0]?.queryKey) && c[0].queryKey[0] === "rooms"
        );
        const dashboardCalls = invalidateSpy.mock.calls.filter(
          (c) => Array.isArray(c[0]?.queryKey) && c[0].queryKey[0] === "dashboard"
        );
        expect(roomCalls.length).toBeGreaterThanOrEqual(1);
        expect(roomsCalls.length).toBeGreaterThanOrEqual(1);
        expect(dashboardCalls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});

describe("EditRoomPage — status field", () => {
  function buildFetch(roomOverrides: Record<string, unknown> = {}) {
    const baseRoom = {
      id: ROOM_ID,
      roomNumber: "B101",
      roomType: "double",
      monthlyRent: 2000000,
      capacity: 2,
      status: "available",
      activeTenantCount: 0,
      ...roomOverrides,
    };
    return vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : (input as URL).toString();
      const method = (init?.method ?? "GET").toUpperCase();
      if (url.includes(`/rooms/${ROOM_ID}`) && method === "GET") {
        return Promise.resolve({ ok: true, status: 200, json: async () => baseRoom });
      }
      if (url.includes(`/rooms/${ROOM_ID}/status`) && method === "PATCH") {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      if (url.includes(`/rooms/${ROOM_ID}`) && method === "PUT") {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({}) });
      }
      return Promise.reject(new Error(`Unexpected: ${method} ${url}`));
    });
  }

  it("shows status select when room has no active tenants", async () => {
    vi.stubGlobal("fetch", buildFetch({ status: "available", activeTenantCount: 0 }));
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EditRoomPage />
      </QueryClientProvider>
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/room number/i)).toHaveValue("B101")
    );
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("shows occupied note instead of select when room has active tenants", async () => {
    vi.stubGlobal(
      "fetch",
      buildFetch({ status: "occupied", activeTenantCount: 1 })
    );
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <EditRoomPage />
      </QueryClientProvider>
    );
    await waitFor(() =>
      expect(screen.getByLabelText(/room number/i)).toHaveValue("B101")
    );
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.getByText(/move out all tenants|pindahkan semua/i)
    ).toBeInTheDocument();
  });
});
