"use client";

import { PropertyForm } from "@/components/property/property-form";

export default function NewPropertyPage() {
  const handleSubmit = async (_data: { name: string; address: string }) => {
    // Stub: will be wired to API in implementation
  };

  return (
    <div className="space-y-4">
      <PropertyForm mode="create" onSubmit={handleSubmit} />
    </div>
  );
}
