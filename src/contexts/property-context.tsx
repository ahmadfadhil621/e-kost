"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export type PropertyRole = "owner" | "staff";

const ACTIVE_PROPERTY_KEY = "e-kost-active-property-id";

type PropertySummary = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
};

type PropertyContextValue = {
  properties: PropertySummary[];
  activePropertyId: string | null;
  setActivePropertyId: (id: string | null) => void;
  refetch: () => Promise<void>;
  isLoading: boolean;
};

const PropertyContext = createContext<PropertyContextValue | null>(null);

export function PropertyProvider({ children }: { children: React.ReactNode }) {
  const [properties, setProperties] = useState<PropertySummary[]>([]);
  const [activePropertyId, setActiveState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  // Track whether we've already attempted auto-select to avoid repeated redirects
  const hasAutoSelected = useRef(false);

  // Sync activePropertyId from localStorage after mount to avoid hydration mismatch
  // (server has no localStorage, so we must not use it in initial state)
  useEffect(() => {
    const stored = localStorage.getItem(ACTIVE_PROPERTY_KEY);
    if (stored) {
      setActiveState(stored);
    }
  }, []);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/properties", { credentials: "include" });
      if (!res.ok) {return;}
      const data = await res.json();
      const fetched: PropertySummary[] = Array.isArray(data) ? data : [];
      setProperties(fetched);

      // Auto-select when user has exactly one property and none is currently active
      if (fetched.length === 1 && !hasAutoSelected.current) {
        const stored = localStorage.getItem(ACTIVE_PROPERTY_KEY);
        if (!stored) {
          hasAutoSelected.current = true;
          const id = fetched[0].id;
          setActiveState(id);
          localStorage.setItem(ACTIVE_PROPERTY_KEY, id);
          // Only redirect if not already on the dashboard root
          if (typeof window !== "undefined" && window.location.pathname !== "/") {
            router.replace("/");
          }
        }
      }
    } catch {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setActivePropertyId = useCallback((id: string | null) => {
    setActiveState(id);
    if (typeof window !== "undefined") {
      if (id) {localStorage.setItem(ACTIVE_PROPERTY_KEY, id);}
      else {localStorage.removeItem(ACTIVE_PROPERTY_KEY);}
    }
  }, []);

  const value: PropertyContextValue = {
    properties,
    activePropertyId,
    setActivePropertyId,
    refetch,
    isLoading,
  };

  return (
    <PropertyContext.Provider value={value}>
      {children}
    </PropertyContext.Provider>
  );
}

export function usePropertyContext() {
  const ctx = useContext(PropertyContext);
  return ctx;
}

export function useActiveProperty() {
  const ctx = usePropertyContext();
  const activeId = ctx?.activePropertyId ?? null;
  const active = ctx?.properties.find((p) => p.id === activeId) ?? null;
  return { activeProperty: active, activePropertyId: activeId, ...ctx };
}

type PropertyWithRole = {
  id: string;
  name: string;
  address: string;
  ownerId: string;
  role?: PropertyRole;
};

export function useProperty() {
  const { activeProperty, activePropertyId, ...ctx } = useActiveProperty();
  const { data: propertyWithRole } = useQuery({
    queryKey: ["property", activePropertyId],
    queryFn: async (): Promise<PropertyWithRole> => {
      const res = await fetch(`/api/properties/${activePropertyId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch property");
      }
      return res.json();
    },
    enabled: !!activePropertyId,
    staleTime: 60 * 1000,
  });
  const userRole: PropertyRole | null = propertyWithRole?.role ?? null;
  return {
    activeProperty,
    activePropertyId,
    userRole,
    ...ctx,
  };
}
