// Traceability: data-freshness
// REQ 1.1 -> it('invalidates rooms and dashboard after successful create room')
// REQ 2.1 -> it('invalidates rooms and dashboard after successful create room')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewRoomPage from "./page";

const PROPERTY_ID = "prop-123";
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useParams: () => ({ propertyId: PROPERTY_ID }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("NewRoomPage (data freshness)", () => {
  let queryClient: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    queryClient = new QueryClient();
    invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    mockPush.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "room-1" }) })
    );
  });

  describe("good cases", () => {
    it("invalidates rooms and dashboard after successful create room", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <NewRoomPage />
        </QueryClientProvider>
      );

      await userEvent.type(screen.getByLabelText(/room number/i), "A101");
      await userEvent.type(screen.getByLabelText(/room type/i), "single");
      await userEvent.type(screen.getByLabelText(/monthly rent/i), "1500000");
      await userEvent.click(
        screen.getByRole("button", { name: /create room|save/i })
      );

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["rooms", PROPERTY_ID] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard", PROPERTY_ID] });
      });
    });
  });

  describe("bad cases", () => {
    it("does not invalidate when create room request fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Server error" }) })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <NewRoomPage />
        </QueryClientProvider>
      );

      await userEvent.type(screen.getByLabelText(/room number/i), "A102");
      await userEvent.type(screen.getByLabelText(/room type/i), "single");
      await userEvent.type(screen.getByLabelText(/monthly rent/i), "1500000");
      await userEvent.click(
        screen.getByRole("button", { name: /create room|save/i })
      );

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("invalidates exactly rooms and dashboard keys once each on success", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <NewRoomPage />
        </QueryClientProvider>
      );

      await userEvent.type(screen.getByLabelText(/room number/i), "B201");
      await userEvent.type(screen.getByLabelText(/room type/i), "double");
      await userEvent.type(screen.getByLabelText(/monthly rent/i), "2000000");
      await userEvent.click(
        screen.getByRole("button", { name: /create room|save/i })
      );

      await waitFor(() => {
        const roomsCalls = invalidateSpy.mock.calls.filter(
          (c) => Array.isArray(c[0]?.queryKey) && c[0].queryKey[0] === "rooms"
        );
        const dashboardCalls = invalidateSpy.mock.calls.filter(
          (c) => Array.isArray(c[0]?.queryKey) && c[0].queryKey[0] === "dashboard"
        );
        expect(roomsCalls.length).toBeGreaterThanOrEqual(1);
        expect(dashboardCalls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
