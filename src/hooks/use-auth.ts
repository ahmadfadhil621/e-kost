import { authClient } from "@/lib/auth-client";

export function useAuth() {
  const { data: session, isPending } = authClient.useSession();

  return {
    user: session?.user ?? null,
    loading: isPending,
    signIn: async (email: string, password: string) => {
      const { error } = await authClient.signIn.email({ email, password });
      if (error) {throw error;}
    },
    signUp: async (email: string, password: string, name: string) => {
      const { error } = await authClient.signUp.email({
        email,
        password,
        name,
      });
      if (error) {throw error;}
    },
    signOut: async () => {
      const { error } = await authClient.signOut();
      if (error) {throw error;}
    },
  };
}
