"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Render children while loading so the app shell (e.g. header) is visible;
  // avoids blank page and E2E timeouts when session check is slow
  if (!loading && !user) {
    return null;
  }

  return <>{children}</>;
}
