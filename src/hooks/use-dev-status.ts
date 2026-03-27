import { useQuery } from "@tanstack/react-query";

export function useDevStatus() {
  const { data, isLoading } = useQuery<{ isDev: boolean }>({
    queryKey: ["dev-status"],
    queryFn: async () => {
      const res = await fetch("/api/dev-status");
      if (!res.ok) { return { isDev: false }; }
      const json = await res.json();
      return json.data ?? { isDev: false };
    },
    staleTime: 5 * 60 * 1000,
  });

  return { isDev: data?.isDev ?? false, isLoading };
}
