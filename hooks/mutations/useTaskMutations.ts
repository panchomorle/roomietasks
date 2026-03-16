"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useClaimTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { error } = await supabase
        .from("task_instances")
        .update({ assigned_user_id: userId })
        .eq("id", taskId)
        .is("assigned_user_id", null);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-instances"] });
    },
  });
}

export function useUnclaimTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const { error } = await supabase
        .from("task_instances")
        .update({ assigned_user_id: null })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-instances"] });
    },
  });
}

export function useCompleteTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, userId }: { taskId: string; userId: string }) => {
      const { error } = await supabase
        .from("task_instances")
        .update({
          status: "completed" as const,
          completed_by_user_id: userId,
          completed_at: new Date().toISOString(),
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-instances"] });
      queryClient.invalidateQueries({ queryKey: ["completed-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useUncompleteTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const { error } = await supabase
        .from("task_instances")
        .update({
          status: "pending" as const,
          completed_by_user_id: null,
          completed_at: null,
        })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-instances"] });
      queryClient.invalidateQueries({ queryKey: ["completed-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useDeleteTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string }) => {
      const { error } = await supabase
        .from("task_instances")
        .delete()
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-instances"] });
    },
  });
}

export function useEditTaskTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      templateId,
      title,
      description,
      pointsReward,
      recurrencePattern,
      spawnOnCompletion,
    }: {
      templateId: string;
      title: string;
      description: string;
      pointsReward: number;
      recurrencePattern: { type: string; days?: number[] };
      spawnOnCompletion: boolean;
    }) => {
      // 1. Update the parent template
      const { data: template, error: updateError } = await supabase
        .from("task_templates")
        .update({
          title,
          description,
          points_reward: pointsReward,
          recurrence_pattern: recurrencePattern as any,
          spawn_on_completion: spawnOnCompletion,
        } as any)
        .eq("id", templateId)
        .select()
        .single();
        
      if (updateError) throw updateError;

      // 2. Delete all current PENDING instances belonging to this template
      const { error: deleteError } = await supabase
        .from("task_instances")
        .delete()
        .eq("template_id", templateId)
        .eq("status", "pending");

      if (deleteError) throw deleteError;
      
      // 3. Regenerate new pending instances based on the new rules
      const { error: genError } = await supabase.rpc("generate_task_instances", {
        p_template_id: template.id,
        p_start_date: new Date().toISOString(),
        p_count: recurrencePattern.type === "none" || spawnOnCompletion ? 1 : 4,
      });

      if (genError) throw genError;

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-instances"] });
    },
  });
}

export function useCreateTaskTemplate() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      title,
      description,
      pointsReward,
      recurrencePattern,
      spawnOnCompletion,
      userId,
    }: {
      roomId: string;
      title: string;
      description: string;
      pointsReward: number;
      recurrencePattern: { type: string; days?: number[] };
      spawnOnCompletion: boolean;
      userId: string;
    }) => {
      // Create template
      const { data: template, error: templateError } = await supabase
        .from("task_templates")
        .insert({
          room_id: roomId,
          title,
          description,
          points_reward: pointsReward,
          recurrence_pattern: recurrencePattern as any,
          spawn_on_completion: spawnOnCompletion,
          created_by: userId,
        } as any)
        .select()
        .single();

      if (templateError) throw templateError;

      // Generate instances
      const { error: genError } = await supabase.rpc("generate_task_instances", {
        p_template_id: template.id,
        p_start_date: new Date().toISOString(),
        p_count: recurrencePattern.type === "none" || spawnOnCompletion ? 1 : 4,
      });

      if (genError) throw genError;

      return template;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-instances"] });
    },
  });
}

export function useEndPeriod() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId }: { roomId: string }) => {
      const { data, error } = await supabase.rpc("end_period", {
        p_room_id: roomId,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["room"] });
      queryClient.invalidateQueries({ queryKey: ["task-instances"] });
    },
  });
}

export function useCreateRoom() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      contributionPerMember,
      periodDurationDays,
      userId,
    }: {
      name: string;
      contributionPerMember: number;
      periodDurationDays: number;
      userId: string;
    }) => {
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .insert({
          name,
          contribution_per_member: contributionPerMember,
          period_duration_days: periodDurationDays,
          created_by: userId,
        })
        .select()
        .single();

      if (roomError) throw roomError;

      // Auto-join as admin
      const { error: memberError } = await supabase
        .from("room_members")
        .insert({
          room_id: room.id,
          user_id: userId,
          role: "admin",
        });

      if (memberError) throw memberError;

      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function usePreviewRoom() {
  const supabase = createClient();

  return useMutation({
    mutationFn: async (inviteCode: string) => {
      const { data: room, error } = await supabase
        .from("rooms")
        .select("id, name, contribution_per_member, period_duration_days")
        .eq("invite_code", inviteCode.toUpperCase())
        .single();

      if (error) throw new Error("Room not found. Check the invite code.");
      return room;
    },
  });
}

export function useJoinRoom() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ inviteCode, userId }: { inviteCode: string; userId: string }) => {
      // Find room by invite code
      const { data: room, error: roomError } = await supabase
        .from("rooms")
        .select("id")
        .eq("invite_code", inviteCode.toUpperCase())
        .single();

      if (roomError) throw new Error("Room not found. Check the invite code.");

      // Join room
      const { error: joinError } = await supabase
        .from("room_members")
        .insert({
          room_id: room.id,
          user_id: userId,
          role: "member",
        });

      if (joinError) {
        if (joinError.code === "23505") {
          throw new Error("You are already a member of this room.");
        }
        throw joinError;
      }

      return room;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
  });
}

export function useLeaveRoom() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, userId }: { roomId: string; userId: string }) => {
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room-members"] });
    },
  });
}

export function useRemoveMember() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, userIdToRemove }: { roomId: string; userIdToRemove: string }) => {
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", userIdToRemove);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room-members"] });
    },
  });
}

export function useUpdateRoom() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      updates,
    }: {
      roomId: string;
      updates: {
        name?: string;
        contribution_per_member?: number;
        period_duration_days?: number;
      };
    }) => {
      const { data, error } = await supabase
        .from("rooms")
        .update(updates)
        .eq("id", roomId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["room"] });
    },
  });
}
