import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isDevEmail } from "@/lib/dev-emails";
import { CurrencySection } from "@/components/settings/CurrencySection";

export default async function CurrenciesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/settings");
  }

  if (!isDevEmail(session.user.email)) {
    redirect("/settings");
  }

  return (
    <main className="w-full space-y-6">
      <CurrencySection />
    </main>
  );
}
