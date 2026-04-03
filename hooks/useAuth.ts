"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useAuth() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: user = null, isLoading: loading } = useQuery({
    queryKey: ["auth-user"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user ?? null;
    },
    staleTime: 1000 * 60 * 60, // 1 hour (reuse cache)
  });

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      // Sync auth state changes (login/logout/token refresh) to the cache instantly
      queryClient.setQueryData(["auth-user"], session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase, queryClient]);

  const signInWithGoogle = async (nextPath?: string) => {
    const redirectTo = nextPath 
      ? `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`
      : `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    queryClient.setQueryData(["auth-user"], null);
  };

  return { user, loading, signInWithGoogle, signOut };
}
