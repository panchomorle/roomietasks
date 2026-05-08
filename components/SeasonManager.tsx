"use client";

import { useState, useEffect, useRef } from "react";
import { useAtom } from "jotai";
import { useRooms } from "@/hooks/queries/useRooms";
import { useEndPeriod } from "@/hooks/mutations/useTaskMutations";
import { useLatestEndedSeason } from "@/hooks/queries/useSeasonData";
import { useAuth } from "@/hooks/useAuth";
import { EndSeasonModal } from "@/components/modals";
import { currentRoomIdAtom, seenSeasonSummariesAtom } from "@/store/atoms";
import { Tables } from "@/types/database";

type Room = Tables<"rooms">;

/**
 * SeasonManager handles two flows:
 *
 * 1. **Admin expiration** — When a room's season time has elapsed and the current
 *    user is admin, show the EndSeasonModal in admin/confirmation mode.
 *
 * 2. **Member summary** — After a season is ended (by an admin), show a read-only
 *    summary modal to all members (non-admin) once per season, tracked in localStorage.
 */
export function SeasonManager() {
  const { user } = useAuth();
  const { data: rooms } = useRooms();
  const endPeriod = useEndPeriod();

  // --- Admin expired-season state ---
  const [expiredRoom, setExpiredRoom] = useState<Room | null>(null);
  const dismissedRoomIds = useRef<Set<string>>(new Set());

  // --- Member summary state ---
  const [currentRoomId] = useAtom(currentRoomIdAtom);
  const [seenSummaries, setSeenSummaries] = useAtom(seenSeasonSummariesAtom);
  const [summaryPeriodId, setSummaryPeriodId] = useState<string | null>(null);
  const [summaryRoomId, setSummaryRoomId] = useState<string | null>(null);
  const [summaryRoom, setSummaryRoom] = useState<Room | null>(null);

  // Determine the user's role in the current room
  const currentMembership = rooms?.find((m: any) => m.room_id === currentRoomId);
  const isAdmin = currentMembership?.role === "admin";

  // Fetch latest ended season for the active room (only for non-admin detection)
  const { data: latestSeason } = useLatestEndedSeason(
    // Only fetch when we have a room selected and are not already showing the admin modal
    currentRoomId && !expiredRoom ? currentRoomId : null
  );

  // ==========================================
  // Flow 1: Admin expired-season detection
  // ==========================================
  useEffect(() => {
    if (!rooms) return;
    if (expiredRoom) return;

    for (const membership of rooms) {
      if (membership.role !== "admin") continue;

      const room = membership.rooms as unknown as Room;
      if (!room || !room.current_period_start_date || !room.period_duration_days) continue;
      if (dismissedRoomIds.current.has(room.id)) continue;

      const startDate = new Date(room.current_period_start_date);
      const endDate = new Date(startDate.getTime() + room.period_duration_days * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now > endDate) {
        setExpiredRoom(room);
        return;
      }
    }
  }, [rooms, expiredRoom]);

  // ==========================================
  // Flow 2: Member summary detection
  // ==========================================
  useEffect(() => {
    // Don't show summary if admin modal is active or there's no season data
    if (expiredRoom) return;
    if (!latestSeason) return;
    if (!user?.id) return;

    // Skip if the user has already seen this season's summary
    if (seenSummaries[latestSeason.id]) return;

    // Skip if the admin has an active expired-season modal taking priority
    if (summaryPeriodId) return;

    // Find the room object for this season to display its name
    const membership = rooms?.find((m: any) => m.room_id === latestSeason.room_id);
    if (!membership) return;
    const room = membership.rooms as unknown as Room;

    // For admins: they already confirmed via the admin modal, so auto-mark as seen
    if (membership.role === "admin") {
      setSeenSummaries((prev) => ({ ...prev, [latestSeason.id]: true }));
      return;
    }

    setSummaryPeriodId(latestSeason.id);
    setSummaryRoomId(latestSeason.room_id);
    setSummaryRoom(room);
  }, [latestSeason, expiredRoom, user?.id, seenSummaries, rooms, summaryPeriodId, setSeenSummaries]);

  // ==========================================
  // Admin modal handlers
  // ==========================================
  const handleAdminClose = () => {
    dismissedRoomIds.current.add(expiredRoom!.id);
    setExpiredRoom(null);
  };

  const handleAdminConfirm = () => {
    dismissedRoomIds.current.add(expiredRoom!.id);
    endPeriod.mutate({ roomId: expiredRoom!.id });
    setExpiredRoom(null);
  };

  // ==========================================
  // Summary modal handler
  // ==========================================
  const handleSummaryClose = () => {
    if (summaryPeriodId) {
      setSeenSummaries((prev) => ({ ...prev, [summaryPeriodId]: true }));
    }
    setSummaryPeriodId(null);
    setSummaryRoomId(null);
    setSummaryRoom(null);
  };

  // Admin modal takes priority
  if (expiredRoom) {
    return (
      <EndSeasonModal
        isOpen={true}
        onClose={handleAdminClose}
        onConfirm={handleAdminConfirm}
        roomId={expiredRoom.id}
        room={expiredRoom}
        mode="admin"
      />
    );
  }

  // Member summary modal
  if (summaryPeriodId && summaryRoomId) {
    return (
      <EndSeasonModal
        isOpen={true}
        onClose={handleSummaryClose}
        roomId={summaryRoomId}
        room={summaryRoom}
        mode="summary"
        periodId={summaryPeriodId}
      />
    );
  }

  return null;
}
