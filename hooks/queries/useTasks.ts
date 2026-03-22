"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { TaskFilter, TaskSort } from "@/store/atoms";

export function useTaskInstances(
  roomId: string | null,
  filter: TaskFilter,
  sort: TaskSort,
  userId: string | undefined
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["task-instances", roomId, filter, sort, userId],
    queryFn: async () => {
      let query = supabase
        .from("task_instances")
        .select("*, profiles!task_instances_assigned_user_id_profiles_fkey(full_name, avatar_url), completer:profiles!task_instances_completed_by_user_id_profiles_fkey(full_name, avatar_url), template:task_templates(*)")
        .eq("room_id", roomId!)
        .eq("status", "pending");

      // Apply Filter
      if (filter === "unassigned") {
        query = query.is("assigned_user_id", null);
      } else if (filter === "mine") {
        query = query.eq("assigned_user_id", userId!);
      }

      // Apply Sort
      if (sort === "due_date_asc") {
        query = query.order("due_date", { ascending: true });
      } else if (sort === "due_date_desc") {
        query = query.order("due_date", { ascending: false });
      } else if (sort === "points_desc") {
        query = query.order("points_reward", { ascending: false });
      } else if (sort === "points_asc") {
        query = query.order("points_reward", { ascending: true });
      } else if (sort === "title_asc") {
        query = query.order("title", { ascending: true });
      } else if (sort === "created_at_desc") {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!roomId && (filter !== "mine" || !!userId),
  });
}

export function useCompletedTasks(
  roomId: string | null,
  limit: number = 20,
  offset: number = 0
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["completed-tasks", roomId, limit, offset],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("task_instances")
        .select("*, profiles!task_instances_completed_by_user_id_profiles_fkey(full_name, avatar_url)")
        .eq("room_id", roomId!)
        .eq("status", "completed")
        .gte("completed_at", sevenDaysAgo.toISOString())
        .order("completed_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });
}

export function useLeaderboard(roomId: string | null, periodStart: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["leaderboard", roomId, periodStart],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_instances")
        .select("completed_by_user_id, points_reward, profiles!task_instances_completed_by_user_id_profiles_fkey(full_name, avatar_url, email)")
        .eq("room_id", roomId!)
        .eq("status", "completed")
        .gte("completed_at", periodStart!)
        .not("completed_by_user_id", "is", null);

      if (error) throw error;

      // Aggregate points per user
      const pointsMap = new Map<
        string,
        { userId: string; points: number; tasksCompleted: number; fullName: string | null; avatarUrl: string | null; email: string | null }
      >();

      for (const row of data) {
        const uid = row.completed_by_user_id!;
        const existing = pointsMap.get(uid);
        // Supabase returns the joined table as the alias 'profiles', but let's double check type
        const profile = row.profiles as unknown as { full_name: string | null; avatar_url: string | null; email: string | null } | null;
        if (existing) {
          existing.points += row.points_reward;
          existing.tasksCompleted += 1;
        } else {
          pointsMap.set(uid, {
            userId: uid,
            points: row.points_reward,
            tasksCompleted: 1,
            fullName: profile?.full_name ?? null,
            avatarUrl: profile?.avatar_url ?? null,
            email: profile?.email ?? null,
          });
        }
      }

      return Array.from(pointsMap.values()).sort((a, b) => b.points - a.points);
    },
    enabled: !!roomId && !!periodStart,
  });
}

export function useUserCyclePoints(
  roomId: string | null,
  userId: string | undefined,
  cycleStart: Date | undefined
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-cycle-points", roomId, userId, cycleStart?.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_instances")
        .select("points_reward")
        .eq("room_id", roomId!)
        .eq("status", "completed")
        .eq("completed_by_user_id", userId!)
        .gte("completed_at", cycleStart!.toISOString());

      if (error) throw error;

      return data.reduce((sum, task) => sum + task.points_reward, 0);
    },
    enabled: !!roomId && !!userId && !!cycleStart,
  });
}
