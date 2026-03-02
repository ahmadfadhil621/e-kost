"use client";

import "@/lib/i18n";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppHeader } from "@/components/layout/app-header";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1 px-4 py-4">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
