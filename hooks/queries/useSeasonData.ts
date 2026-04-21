"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

/**
 * Fetch all past seasons for a room, ordered by period_end DESC.
 * Includes winner profile info via a separate lookup.
 */
export function usePastSeasons(roomId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["past-seasons", roomId],
    queryFn: async () => {
      // Fetch period history
      const { data: periods, error } = await supabase
        .from("period_history")
        .select("*")
        .eq("room_id", roomId!)
        .order("period_end", { ascending: false });

      if (error) throw error;

      // Fetch winner profiles for all periods that have a winner
      const winnerIds = [...new Set(periods.filter(p => p.winner_user_id).map(p => p.winner_user_id!))];
      let winnerMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

      if (winnerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", winnerIds);

        if (profiles) {
          for (const p of profiles) {
            winnerMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
          }
        }
      }

      // Attach winner profile to each period
      return periods.map(p => ({
        ...p,
        winner: p.winner_user_id ? winnerMap.get(p.winner_user_id) ?? null : null,
      }));
    },
    enabled: !!roomId,
  });
}

/**
 * Fetch a single season detail: period_history row + user history with profiles + achievements.
 */
export function useSeasonDetail(periodId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["season-detail", periodId],
    queryFn: async () => {
      // Fetch period info
      const { data: period, error: periodError } = await supabase
        .from("period_history")
        .select("*")
        .eq("id", periodId!)
        .single();

      if (periodError) throw periodError;

      // Fetch user history
      const { data: userHistoryRaw, error: uhError } = await supabase
        .from("period_user_history")
        .select("*")
        .eq("period_id", periodId!)
        .order("points_earned", { ascending: false });

      if (uhError) throw uhError;

      // Fetch profiles for all users in history
      const userIds = userHistoryRaw.map(uh => uh.user_id);
      let profileMap = new Map<string, { full_name: string | null; avatar_url: string | null; email: string | null }>();

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, email")
          .in("id", userIds);

        if (profiles) {
          for (const p of profiles) {
            profileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url, email: p.email });
          }
        }
      }

      const userHistory = userHistoryRaw.map(uh => ({
        ...uh,
        profile: profileMap.get(uh.user_id) ?? null,
      }));

      // Fetch achievements
      const { data: achievementsRaw, error: achError } = await supabase
        .from("period_achievements")
        .select("*")
        .eq("period_id", periodId!);

      if (achError) throw achError;

      // Attach profiles to achievements
      const achUserIds = achievementsRaw.map(a => a.user_id);
      let achProfileMap = new Map<string, { full_name: string | null; avatar_url: string | null }>();

      if (achUserIds.length > 0) {
        const { data: achProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", achUserIds);

        if (achProfiles) {
          for (const p of achProfiles) {
            achProfileMap.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
          }
        }
      }

      const achievements = achievementsRaw.map(a => ({
        ...a,
        profile: achProfileMap.get(a.user_id) ?? null,
      }));

      return { period, userHistory, achievements };
    },
    enabled: !!periodId,
  });
}

/**
 * Fetch completed task instances for a room within a date range.
 * Used for the EndSeasonModal achievement preview (before the season is ended).
 */
export function useSeasonTaskInstances(
  roomId: string | null,
  periodStart: string | undefined,
  periodEnd?: string
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["season-tasks", roomId, periodStart, periodEnd],
    queryFn: async () => {
      let query = supabase
        .from("task_instances")
        .select("completed_by_user_id, points_reward")
        .eq("room_id", roomId!)
        .eq("status", "completed")
        .gte("completed_at", periodStart!)
        .not("completed_by_user_id", "is", null);

      if (periodEnd) {
        query = query.lt("completed_at", periodEnd);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!roomId && !!periodStart,
  });
}
