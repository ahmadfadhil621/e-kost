"use client";

import "@/lib/i18n";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppHeader } from "@/components/layout/app-header";
import { PropertyProvider } from "@/contexts/property-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <PropertyProvider>
        <div className="flex min-h-screen flex-col">
          <AppHeader />
          <main className="flex-1 px-4 py-4">{children}</main>
        </div>
      </PropertyProvider>
    </ProtectedRoute>
  );
}
