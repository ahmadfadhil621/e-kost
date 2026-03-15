// Traceability: data-freshness
// REQ 1.2 -> it('invalidates tenants, balances, and dashboard after successful create tenant')
// REQ 2.1 -> it('invalidates tenants, balances, and dashboard after successful create tenant')

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NewTenantPage from "./page";

const PROPERTY_ID = "prop-456";
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useParams: () => ({ propertyId: PROPERTY_ID }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("NewTenantPage (data freshness)", () => {
  let queryClient: QueryClient;
  let invalidateSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    queryClient = new QueryClient();
    invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    mockPush.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: "tenant-1" }) })
    );
  });

  describe("good cases", () => {
    it("invalidates tenants, balances, and dashboard after successful create tenant", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <NewTenantPage />
        </QueryClientProvider>
      );

      await userEvent.type(screen.getByLabelText(/name|full name/i), "Jane Doe");
      await userEvent.type(screen.getByLabelText(/phone/i), "081234567890");
      await userEvent.type(screen.getByLabelText(/email/i), "jane@example.com");
      await userEvent.click(
        screen.getByRole("button", { name: /create tenant|save|submit/i })
      );

      await waitFor(() => {
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["tenants", PROPERTY_ID] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["balances", PROPERTY_ID] });
        expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["dashboard", PROPERTY_ID] });
      });
    });
  });

  describe("bad cases", () => {
    it("does not invalidate when create tenant request fails", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Server error" }) })
      );

      render(
        <QueryClientProvider client={queryClient}>
          <NewTenantPage />
        </QueryClientProvider>
      );

      await userEvent.type(screen.getByLabelText(/name|full name/i), "Bob");
      await userEvent.type(screen.getByLabelText(/phone/i), "0811111111");
      await userEvent.type(screen.getByLabelText(/email/i), "bob@test.com");
      await userEvent.click(
        screen.getByRole("button", { name: /create tenant|save|submit/i })
      );

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled();
      });
      expect(invalidateSpy).not.toHaveBeenCalled();
    });
  });

  describe("edge cases", () => {
    it("invalidates tenants, balances, and dashboard keys on success", async () => {
      render(
        <QueryClientProvider client={queryClient}>
          <NewTenantPage />
        </QueryClientProvider>
      );

      await userEvent.type(screen.getByLabelText(/name|full name/i), "Edge User");
      await userEvent.type(screen.getByLabelText(/phone/i), "08987654321");
      await userEvent.type(screen.getByLabelText(/email/i), "edge@test.com");
      await userEvent.click(
        screen.getByRole("button", { name: /create tenant|save|submit/i })
      );

      await waitFor(() => {
        const tenantsCalls = invalidateSpy.mock.calls.filter(
          (c) => Array.isArray(c[0]?.queryKey) && c[0].queryKey[0] === "tenants"
        );
        const balancesCalls = invalidateSpy.mock.calls.filter(
          (c) => Array.isArray(c[0]?.queryKey) && c[0].queryKey[0] === "balances"
        );
        const dashboardCalls = invalidateSpy.mock.calls.filter(
          (c) => Array.isArray(c[0]?.queryKey) && c[0].queryKey[0] === "dashboard"
        );
        expect(tenantsCalls.length).toBeGreaterThanOrEqual(1);
        expect(balancesCalls.length).toBeGreaterThanOrEqual(1);
        expect(dashboardCalls.length).toBeGreaterThanOrEqual(1);
      });
    });
  });
});
