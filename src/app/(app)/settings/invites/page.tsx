import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { isDevEmail } from "@/lib/dev-emails";
import { InviteSection } from "@/components/settings/InviteSection";

export default async function InvitesPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/settings");
  }

  if (!isDevEmail(session.user.email)) {
    redirect("/settings");
  }

  return (
    <main className="w-full space-y-6">
      <h1 className="text-xl font-semibold text-foreground">
        Invite Management
      </h1>
      <InviteSection userRole="owner" />
    </main>
  );
}
