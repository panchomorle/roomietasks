"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Fetch a single user's public profile by their user ID.
 */
export function useProfile(userId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .eq("id", userId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
