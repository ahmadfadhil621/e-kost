"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

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
  const [activePropertyId, setActiveState] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem(ACTIVE_PROPERTY_KEY) : null
  );
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/properties", { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setProperties(Array.isArray(data) ? data : []);
    } catch {
      setProperties([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const setActivePropertyId = useCallback((id: string | null) => {
    setActiveState(id);
    if (typeof window !== "undefined") {
      if (id) localStorage.setItem(ACTIVE_PROPERTY_KEY, id);
      else localStorage.removeItem(ACTIVE_PROPERTY_KEY);
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
