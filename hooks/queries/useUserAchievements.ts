"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { AchievementKey } from "@/lib/achievements";

/**
 * Fetch all achievements earned by a user in a specific room,
 * across all past seasons. Returns a map of key → count.
 */
export function useUserAchievements(userId: string | null, roomId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-achievements", userId, roomId],
    queryFn: async () => {
      // Join period_achievements with period_history to scope by room
      const { data, error } = await supabase
        .from("period_achievements")
        .select("key, period_history!inner(room_id)")
        .eq("user_id", userId!)
        .eq("period_history.room_id", roomId!);

      if (error) throw error;

      // Count occurrences per achievement key
      const countMap = new Map<AchievementKey, number>();
      for (const row of data ?? []) {
        const key = row.key as AchievementKey;
        countMap.set(key, (countMap.get(key) ?? 0) + 1);
      }
      return countMap;
    },
    enabled: !!userId && !!roomId,
  });
}
