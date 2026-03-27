"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { RegistrationForm } from "@/components/auth/registration-form";

function RegisterContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  return <RegistrationForm token={token} />;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <RegisterContent />
    </Suspense>
  );
}
