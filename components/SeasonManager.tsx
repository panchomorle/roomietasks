"use client";

import { useState, useEffect } from "react";
import { useRooms } from "@/hooks/queries/useRooms";
import { EndSeasonModal } from "./EndSeasonModal";
import { Tables } from "@/types/database";

type Room = Tables<"rooms">;

export function SeasonManager() {
  const { data: rooms } = useRooms();
  const [expiredRoom, setExpiredRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (!rooms) return;

    for (const membership of rooms) {
      if (membership.role !== "admin") continue;
      
      const room = membership.rooms as unknown as Room;
      if (!room || !room.current_period_start_date || !room.period_duration_days) continue;

      const startDate = new Date(room.current_period_start_date);
      const endDate = new Date(startDate.getTime() + room.period_duration_days * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now > endDate && !expiredRoom) {
        setExpiredRoom(room);
        return; // handle one at a time
      }
    }
  }, [rooms, expiredRoom]);

  if (!expiredRoom) return null;

  return (
    <EndSeasonModal 
      room={expiredRoom} 
      onClose={() => setExpiredRoom(null)} 
    />
  );
}
