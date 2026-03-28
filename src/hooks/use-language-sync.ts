import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import i18n from "@/lib/i18n";

async function fetchLanguage(): Promise<string> {
  const res = await fetch("/api/user/language");
  if (!res.ok) { throw new Error("Failed to fetch language"); }
  const data = await res.json();
  return data.data.language as string;
}

export function useLanguageSync() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["user", "language"],
    queryFn: fetchLanguage,
    enabled: !!user,
    retry: false,
  });

  useEffect(() => {
    if (data && data !== i18n.language) { i18n.changeLanguage(data); }
  }, [data]);
}
