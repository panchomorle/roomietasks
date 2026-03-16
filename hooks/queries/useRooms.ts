"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useRooms() {
  const supabase = createClient();
  const { user } = useAuth();

  return useQuery({
    queryKey: ["rooms", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_members")
        .select("*, rooms(*)")
        .eq("user_id", user!.id);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useRoom(roomId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["room", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rooms")
        .select("*")
        .eq("id", roomId!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });
}

export function useRoomMembers(roomId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["room-members", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_members")
        .select("*, profiles!room_members_user_id_profiles_fkey(*)")
        .eq("room_id", roomId!);

      if (error) throw error;
      return data;
    },
    enabled: !!roomId,
  });
}

export function useRoomTrophies(roomId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["room-trophies", roomId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("period_history")
        .select("winner_user_id")
        .eq("room_id", roomId!)
        .not("winner_user_id", "is", null);

      if (error) throw error;

      const trophyMap = new Map<string, number>();
      for (const row of data) {
        const uid = row.winner_user_id!;
        trophyMap.set(uid, (trophyMap.get(uid) || 0) + 1);
      }
      return trophyMap;
    },
    enabled: !!roomId,
  });
}
