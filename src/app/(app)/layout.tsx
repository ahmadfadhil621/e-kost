"use client";

import "@/lib/i18n";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AppHeader } from "@/components/layout/app-header";
import { AppNav } from "@/components/layout/app-nav";
import { PropertySelector } from "@/components/property/property-selector";
import { PropertyProvider, usePropertyContext } from "@/contexts/property-context";
import { Providers } from "@/components/providers";

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = usePropertyContext();
  const activeId = ctx?.activePropertyId ?? null;
  const properties = ctx?.properties ?? [];
  const isLoading = ctx?.isLoading ?? true;
  const showPropertySelector = !isLoading && properties.length > 0 && !activeId;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader />
      <main className="flex-1 px-4 py-4 pb-20 max-w-[480px] mx-auto w-full">
        {showPropertySelector ? <PropertySelector /> : children}
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
