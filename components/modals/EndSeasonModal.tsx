'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useLeaderboard } from '@/hooks/queries/useTasks';
import { useRoom, useRoomMembers } from '@/hooks/queries/useRooms';
import { useSeasonTaskInstances, useSeasonDetail } from '@/hooks/queries/useSeasonData';
import type { Tables } from '@/types/database';
import { useTranslation } from '@/hooks/useTranslation';
import { formatPoints } from '@/lib/numberUtils';
import { ACHIEVEMENT_DEFS, computeAchievementPreviews } from '@/lib/achievements';
import type { AchievementKey } from '@/lib/achievements';

type Room = Tables<'rooms'>;

interface EndSeasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  roomId: string;
  room?: Room | null;
  /** 'admin' = confirmation flow (default), 'summary' = read-only historical view */
  mode?: 'admin' | 'summary';
  /** Required for summary mode — the period_history ID to display */
  periodId?: string | null;
}

export function EndSeasonModal({
  isOpen,
  onClose,
  onConfirm,
  roomId,
  room: roomProp,
  mode = 'admin',
  periodId,
}: EndSeasonModalProps) {
  const { t, language } = useTranslation();
  const router = useRouter();
  const isSummary = mode === 'summary';

  // --- Admin mode data (live leaderboard + task instances) ---
  const { data: fetchedRoom } = useRoom(roomProp ? null : roomId);
  const room = roomProp ?? fetchedRoom;
  const { data: members } = useRoomMembers(isSummary ? null : roomId);
  const { data: leaderboard } = useLeaderboard(
    isSummary ? null : roomId,
    isSummary ? undefined : room?.current_period_start_date
  );
  const { data: seasonTasks } = useSeasonTaskInstances(
    isSummary ? null : roomId,
    isSummary ? undefined : room?.current_period_start_date
  );

  // --- Summary mode data (historical) ---
  const { data: seasonDetail } = useSeasonDetail(isSummary ? periodId ?? null : null);

  if (!isOpen) return null;

  // ============================================================
  // Build unified participant list depending on mode
  // ============================================================
  let totalPool = 0;
  let totalPoints = 0;
  let totalTasks = 0;
  let allParticipants: {
    userId: string;
    points: number;
    tasksCompleted: number;
    fullName: string;
    avatarUrl: string | null;
    share: number;
    pct: number;
  }[] = [];
  let achievementItems: { key: string; userName: string }[] = [];

  if (isSummary && seasonDetail) {
    // --- Historical data ---
    totalPool = Number(seasonDetail.period.total_pool) || 0;
    totalPoints = Number(seasonDetail.period.total_points) || 0;

    const userHistory = seasonDetail.userHistory ?? [];
    totalTasks = 0; // period_user_history doesn't store task count, derive from points presence

    allParticipants = userHistory.map((uh) => {
      const pts = Number(uh.points_earned) || 0;
      const share = Number(uh.money_received) || 0;
      const pct = totalPoints > 0 ? (pts / totalPoints) * 100 : 0;
      return {
        userId: uh.user_id,
        points: pts,
        tasksCompleted: 0, // not stored in period_user_history
        fullName: (uh as any).profile?.full_name ?? '?',
        avatarUrl: (uh as any).profile?.avatar_url ?? null,
        share,
        pct,
      };
    });

    // Achievements from period_achievements
    achievementItems = (seasonDetail.achievements ?? []).map((a) => {
      const profile = (a as any).profile;
      return {
        key: a.key,
        userName: profile?.full_name ?? '?',
      };
    });
  } else {
    // --- Live data (admin mode) ---
    const memberCount = members?.length ?? 0;
    const contribution = room?.contribution_per_member ?? 0;
    totalPool = contribution * memberCount;
    totalPoints = leaderboard?.reduce((sum, u) => sum + u.points, 0) ?? 0;
    totalTasks = leaderboard?.reduce((sum, u) => sum + u.tasksCompleted, 0) ?? 0;

    const participants = (leaderboard ?? []).map((entry) => {
      const share = totalPoints > 0 ? (entry.points / totalPoints) * totalPool : 0;
      const pct = totalPoints > 0 ? (entry.points / totalPoints) * 100 : 0;
      return { ...entry, share, pct };
    });

    const participantIds = new Set(participants.map((p) => p.userId));
    const zeroMembers = (members ?? [])
      .filter((m) => !participantIds.has(m.user_id))
      .map((m) => {
        const profile = m.profiles as any;
        return {
          userId: m.user_id,
          points: 0,
          tasksCompleted: 0,
          fullName: profile?.full_name ?? profile?.email ?? '?',
          avatarUrl: profile?.avatar_url ?? null,
          share: 0,
          pct: 0,
        };
      });

    allParticipants = [...participants, ...zeroMembers];

    // Compute achievement previews (client-side)
    const winnerId =
      allParticipants.length > 0 && allParticipants[0].points > 0 ? allParticipants[0].userId : null;
    const winnerName =
      allParticipants.length > 0 && allParticipants[0].points > 0 ? allParticipants[0].fullName : null;
    const userNameMap = new Map<string, string>();
    for (const p of allParticipants) {
      userNameMap.set(p.userId, p.fullName ?? '?');
    }
    const previews = computeAchievementPreviews(
      (seasonTasks ?? []).map((t) => ({
        completed_by_user_id: t.completed_by_user_id,
        points_reward: t.points_reward,
      })),
      room?.point_limit ?? null,
      winnerId,
      winnerName,
      userNameMap
    );
    achievementItems = previews.map((a) => ({ key: a.key, userName: a.userName }));
  }

  const top3 = allParticipants.slice(0, 3);

  // Build podium entries with rank metadata, then reorder visually: [2nd, 1st, 3rd]
  const rankMeta = [
    { height: 'h-28', color: 'bg-yellow-500', label: '1st', textColor: 'text-slate-900', ringColor: 'ring-yellow-500', size: '110px', avatarSize: 'w-14 h-14 text-lg' },
    { height: 'h-20', color: 'bg-slate-400', label: '2nd', textColor: 'text-slate-900', ringColor: 'ring-white/20', size: '90px', avatarSize: 'w-10 h-10 text-sm' },
    { height: 'h-16', color: 'bg-amber-700', label: '3rd', textColor: 'text-white', ringColor: 'ring-white/20', size: '90px', avatarSize: 'w-10 h-10 text-sm' },
  ];
  const podiumEntries = top3.map((entry, i) => ({ ...entry, meta: rankMeta[i] }));
  const podiumOrder = podiumEntries.length >= 3
    ? [podiumEntries[1], podiumEntries[0], podiumEntries[2]]
    : podiumEntries;

  const handleViewDetails = () => {
    if (periodId) {
      router.push(`/dashboard/history/${periodId}`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center pt-6 pb-2 px-6">
          <h2 className="text-2xl font-black text-white">
            {isSummary ? t("season_ended_title") : t("season_summary")}
          </h2>
          <p className="text-sm text-slate-400 mt-1">{room?.name}</p>
        </div>

        {/* Stats Row */}
        <div className="flex justify-center gap-6 px-6 py-4">
          <div className="text-center">
            <p className="text-2xl font-black text-white">${totalPool.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t("prize_pool")}</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-brand-400">{totalPoints}</p>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t("total_points")}</p>
          </div>
          {!isSummary && (
            <div className="text-center">
              <p className="text-2xl font-black text-brand-300">{totalTasks}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t("tasks_done")}</p>
            </div>
          )}
        </div>

        {/* Podium */}
        {top3.length > 0 && (
          <div className="px-6 pb-4">
            <div className="flex items-end justify-center gap-3">
              {podiumOrder.map((entry) => {
                if (!entry) return null;
                const { meta } = entry;
                const isFirst = meta.label === '1st';
                return (
                  <div key={entry.userId} className="flex flex-col items-center" style={{ width: meta.size }}>
                    {/* Avatar */}
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt=""
                        className={`rounded-full object-cover ring-2 mb-2 ${
                          isFirst ? `w-14 h-14 ${meta.ringColor}` : `w-10 h-10 ${meta.ringColor}`
                        }`}
                      />
                    ) : (
                      <div
                        className={`rounded-full bg-brand-600/30 flex items-center justify-center font-bold text-brand-400 mb-2 ring-2 ${meta.ringColor} ${meta.avatarSize}`}
                      >
                        {(entry.fullName ?? '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                    <p className="text-xs font-semibold text-white truncate w-full text-center">
                      {entry.fullName}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatPoints(entry.points, language as 'en' | 'es')} {t("pts")}</p>
                    {/* Podium Bar */}
                    <div className={`w-full ${meta.height} ${meta.color} rounded-t-xl mt-2 flex items-center justify-center`}>
                      <span className={`text-xs font-black ${meta.textColor}`}>{meta.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Achievements */}
        {achievementItems.length > 0 && (
          <div className="px-4 pb-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">{t("achievements")}</h3>
            <div className="grid grid-cols-2 gap-2">
              {achievementItems.map((ach) => {
                const def = ACHIEVEMENT_DEFS[ach.key as AchievementKey];
                if (!def) return null;
                return (
                  <div
                    key={ach.key}
                    className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 flex items-center gap-3"
                  >
                    <span className="text-2xl flex-shrink-0">{def.emoji}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">{t(def.labelKey)}</p>
                      <p className="text-[10px] text-slate-400 truncate">{ach.userName}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Participant Breakdown */}
        <div className="px-4 pb-2">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">{t("prize_distribution")}</h3>
          <div className="space-y-1">
            {allParticipants.map((entry, i) => (
              <div key={entry.userId} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.03]">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-5 text-xs font-bold text-slate-500 text-center flex-shrink-0">{i + 1}</span>
                  {entry.avatarUrl ? (
                    <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center flex-shrink-0 text-brand-400 font-bold text-xs ring-1 ring-brand-500/20">
                      {(entry.fullName ?? '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{entry.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      {formatPoints(entry.points, language as 'en' | 'es')} {t("pts")}
                      {!isSummary && <> &middot; {entry.tasksCompleted} {t("tasks_done")} &middot; {entry.pct.toFixed(1)}%</>}
                      {isSummary && <> &middot; {entry.pct.toFixed(1)}%</>}
                    </p>
                  </div>
                </div>
                <p className={`text-sm font-bold flex-shrink-0 ${i === 0 && entry.points > 0 ? 'text-success' : 'text-slate-300'}`}>
                  ${entry.share.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 flex gap-3 border-t border-white/5">
          {isSummary ? (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-slate-300 font-semibold bg-white/5 hover:bg-white/10 transition-colors"
              >
                {t("close")}
              </button>
              {periodId && (
                <button
                  onClick={handleViewDetails}
                  className="flex-1 py-3 bg-brand-500 text-white font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-brand-500/20"
                >
                  {t("view_details")}
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-slate-300 font-semibold bg-white/5 hover:bg-white/10 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-3 bg-warning text-slate-900 font-bold rounded-2xl hover:brightness-110 transition-all shadow-lg shadow-warning/20"
              >
                {t("end_season")}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
