import { useAuth } from "@/hooks/use-auth";
import i18n from "@/lib/i18n";

function resolveTimezone(userTimezone: string | null | undefined): string {
  if (userTimezone) { return userTimezone; }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
  } catch {
    return "Asia/Jakarta";
  }
}

export function useDateFormatter() {
  const { user } = useAuth();
  const timezone = resolveTimezone(user?.timezone);

  function format(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const { timeZone: callerTz, ...restOptions } = options ?? {};
    const locale = i18n.language || undefined;
    return new Intl.DateTimeFormat(locale, { timeZone: callerTz ?? timezone, ...restOptions }).format(d);
  }

  return { format, timezone };
}
