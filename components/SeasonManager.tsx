"use client";

import { useState, useEffect, useRef } from "react";
import { useRooms } from "@/hooks/queries/useRooms";
import { useEndPeriod } from "@/hooks/mutations/useTaskMutations";
import { EndSeasonModal } from "@/components/modals";
import { Tables } from "@/types/database";

type Room = Tables<"rooms">;

export function SeasonManager() {
  const { data: rooms } = useRooms();
  const [expiredRoom, setExpiredRoom] = useState<Room | null>(null);
  const endPeriod = useEndPeriod();
  // Track rooms dismissed this session so closing the modal doesn't re-trigger it
  // while the stale rooms data still reports the season as expired.
  const dismissedRoomIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!rooms) return;
    // If we already have a modal open, don't scan again
    if (expiredRoom) return;

    for (const membership of rooms) {
      if (membership.role !== "admin") continue;

      const room = membership.rooms as unknown as Room;
      if (!room || !room.current_period_start_date || !room.period_duration_days) continue;

      // Skip rooms the user has already dismissed or confirmed this session
      if (dismissedRoomIds.current.has(room.id)) continue;

      const startDate = new Date(room.current_period_start_date);
      const endDate = new Date(startDate.getTime() + room.period_duration_days * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now > endDate) {
        setExpiredRoom(room);
        return; // handle one at a time
      }
    }
  }, [rooms, expiredRoom]);

  if (!expiredRoom) return null;

  const handleClose = () => {
    // Remember this room so the effect doesn't immediately re-open it
    dismissedRoomIds.current.add(expiredRoom.id);
    setExpiredRoom(null);
  };

  const handleConfirm = () => {
    dismissedRoomIds.current.add(expiredRoom.id);
    endPeriod.mutate({ roomId: expiredRoom.id });
    setExpiredRoom(null);
  };

  return (
    <EndSeasonModal
      isOpen={true}
      onClose={handleClose}
      onConfirm={handleConfirm}
      roomId={expiredRoom.id}
      room={expiredRoom}
    />
  );
}
