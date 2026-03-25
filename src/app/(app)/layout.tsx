"use client";

import "@/lib/i18n";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { PropertyProvider } from "@/contexts/property-context";
import { Providers } from "@/components/providers";

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      {/* Shared max-width scale: max-w-[480px] md:max-w-2xl lg:max-w-3xl — keep in sync with app-header.tsx and app-nav.tsx */}
      <main className="flex-1 px-4 py-4 pb-20 max-w-[480px] md:max-w-2xl lg:max-w-3xl mx-auto w-full">
        {children}
      </main>
      <AppNav />
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <Providers>
        <PropertyProvider>
          <AppLayoutContent>{children}</AppLayoutContent>
        </PropertyProvider>
      </Providers>
    </ProtectedRoute>
  );
}
