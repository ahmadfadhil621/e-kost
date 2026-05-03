import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export function useTimezoneSync() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || user.timezone !== null) { return; }

    let detectedTz: string;
    try {
      detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return;
    }

    if (!detectedTz) { return; }

    fetch("/api/user/timezone", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: detectedTz }),
    }).catch(() => undefined);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.timezone]);
}
