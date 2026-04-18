"use client";

import { useAtomValue } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useRoom, useRoomMembers, useRoomTrophies } from "@/hooks/queries/useRooms";
import { useLeaderboard } from "@/hooks/queries/useTasks";
import { useEndPeriod, useRemoveMember, useUpdateRoom } from "@/hooks/mutations/useTaskMutations";
import { useAuth } from "@/hooks/useAuth";
import { EndSeasonModal, DeleteTaskModal } from "@/components/modals";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatPoints } from "@/lib/numberUtils";

export default function LeaderboardPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const roomId = useAtomValue(currentRoomIdAtom);

  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: members, isLoading: membersLoading } = useRoomMembers(roomId);
  const { data: trophies, isLoading: trophiesLoading } = useRoomTrophies(roomId);
  const { data: leaderboard, isLoading: leaderboardLoading } = useLeaderboard(
    roomId,
    room?.current_period_start_date
  );

  const endPeriod = useEndPeriod();
  const removeMember = useRemoveMember();
  const updateRoom = useUpdateRoom();

  const [sortBy, setSortBy] = useState<"points" | "alpha">("points");
  const [isEditingPool, setIsEditingPool] = useState(false);
  const [editContribution, setEditContribution] = useState("");
  const [editDuration, setEditDuration] = useState("");
  const [showEndModal, setShowEndModal] = useState(false);
  const [kickConfirm, setKickConfirm] = useState<{ userId: string; name: string } | null>(null);

  if (!roomId || roomLoading || membersLoading || trophiesLoading) {
    return <div className="p-8"><div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin mx-auto" /></div>;
  }

  const memberCount = members?.length ?? 0;
  const contribution = room?.contribution_per_member ?? 0;
  const totalPool = contribution * memberCount;
  const totalPoints = leaderboard?.reduce((sum, u) => sum + u.points, 0) ?? 0;
  const isAdmin = members?.find((m) => m.user_id === user?.id)?.role === "admin";

  // Merge members with leaderboard scores
  let mergedMembers = (members || []).map((m) => {
    const profile = m.profiles as any;
    const lbEntry = leaderboard?.find(l => l.userId === m.user_id);
    const points = lbEntry?.points ?? 0;
    const fullName = profile?.full_name || lbEntry?.fullName || profile?.email || lbEntry?.email || "?";
    return {
      userId: m.user_id,
      role: m.role,
      fullName,
      avatarUrl: profile?.avatar_url || lbEntry?.avatarUrl,
      points,
      trophies: trophies?.get(m.user_id) || 0,
    };
  });

  // Sort logic
  if (sortBy === "points") {
    mergedMembers.sort((a, b) => b.points - a.points);
  } else {
    // Alphabetical
    mergedMembers.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  // Grand Drop countdown
  let timeLeftStr = "";
  if (room?.current_period_start_date && room?.period_duration_days) {
    const startDate = new Date(room.current_period_start_date);
    const endDate = new Date(startDate.getTime() + room.period_duration_days * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();

    if (diffTime > 0) {
      const daysLeft = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      timeLeftStr = daysLeft > 1
        ? t("days_left_grand_drop").replace("{count}", daysLeft.toString())
        : daysLeft === 1
          ? t("day_left_grand_drop").replace("{count}", "1")
          : hoursLeft > 1
            ? t("hours_left_grand_drop").replace("{count}", hoursLeft.toString())
            : hoursLeft === 1
              ? t("hour_left_grand_drop").replace("{count}", "1")
              : t("ends_today");
    } else {
      timeLeftStr = "Season Expired!";
    }
  }

  return (
    <div className="pb-10">
      <div className="mb-6 pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("leaderboard")}</h1>
          <p className="text-sm font-medium text-brand-400 mt-1">{room?.name}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Monetary Pot Highlight */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-violet-600/20 border border-brand-500/30 rounded-[28px] p-6 mb-6 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl" />
        {isEditingPool ? (
          <div className="relative z-10 w-full max-w-sm mx-auto flex flex-col items-center">
            <h3 className="text-white font-bold mb-4">{t("edit_pool_settings")}</h3>
            <div className="w-full space-y-4">
              <div>
                <label className="text-xs text-brand-300 font-semibold mb-1 block">{t("contribution_per_member")}</label>
                <input
                  type="number"
                  value={editContribution}
                  onChange={(e) => setEditContribution(e.target.value)}
                  className="w-full bg-white/10 border border-brand-500/30 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-brand-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="text-xs text-brand-300 font-semibold mb-1 block">{t("period_duration")}</label>
                <input
                  type="number"
                  value={editDuration}
                  onChange={(e) => setEditDuration(e.target.value)}
                  className="w-full bg-white/10 border border-brand-500/30 rounded-xl px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-brand-500"
                  placeholder="7"
                />
              </div>
            </div>
            <div className="flex items-center gap-3 w-full mt-6">
              <button
                onClick={() => setIsEditingPool(false)}
                className="flex-1 py-2 rounded-xl text-slate-300 font-semibold hover:bg-white/5 transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={async () => {
                  await updateRoom.mutateAsync({
                    roomId,
                    updates: {
                      contribution_per_member: parseFloat(editContribution),
                      period_duration_days: parseInt(editDuration)
                    }
                  });
                  setIsEditingPool(false);
                }}
                disabled={updateRoom.isPending || !editContribution || !editDuration}
                className="flex-1 py-2 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-colors shadow-lg shadow-brand-500/30 disabled:opacity-50"
              >
                {updateRoom.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center relative z-10">
            <p className="text-sm font-semibold text-brand-300 uppercase tracking-widest mb-1">{t("current_pool")}</p>
            <p className="text-5xl font-black text-white tracking-tight mb-2">${totalPool.toFixed(2)}</p>
            <p className="text-xs text-brand-300/70 mb-1">
              {t("based_on_members")
                .replace("{count}", memberCount.toString())
                .replace("${amount}", `$${contribution.toFixed(2)}`)}
            </p>
            <p className="text-[10px] text-brand-300/50 uppercase tracking-widest font-semibold">
              {room?.period_duration_days} {room?.period_duration_days === 1 ? t("period_day") : t("period_days")}
            </p>
            {timeLeftStr && (
              <div className="mt-4 inline-block bg-white/10 px-4 py-1.5 rounded-full border border-brand-500/30">
                <p className="text-xs font-bold text-brand-400 uppercase tracking-wider">
                  {timeLeftStr}
                </p>
              </div>
            )}
            {isAdmin && (
              <button
                onClick={() => {
                  setEditContribution(contribution.toString());
                  setEditDuration(room?.period_duration_days?.toString() || "7");
                  setIsEditingPool(true);
                }}
                className="absolute top-0 right-0 p-2 text-brand-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                title="Edit Pool Settings"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Sort Options & Header */}
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-sm font-bold text-slate-300">{t("room_members")}</h2>
        <div className="flex items-center bg-white/5 rounded-lg p-1">
          <button
            onClick={() => setSortBy("points")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${sortBy === "points" ? "bg-white/10 text-white shadow" : "text-slate-500 hover:text-slate-300"
              }`}
          >
            {t("by_points")}
          </button>
          <button
            onClick={() => setSortBy("alpha")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${sortBy === "alpha" ? "bg-white/10 text-white shadow" : "text-slate-500 hover:text-slate-300"
              }`}
          >
            {t("alpha")}
          </button>
        </div>
      </div>

      {/* Rankings */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-[28px] p-2 sm:p-4 mb-8">
        {leaderboardLoading ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl animate-pulse" />)}
          </div>
        ) : mergedMembers.length > 0 ? (
          <div className="space-y-1">
            {mergedMembers.map((entry, i) => {
              const share = totalPoints > 0 ? (entry.points / totalPoints) * totalPool : 0;
              // Only first place highlights, and only if sorting by points
              const isFirst = sortBy === "points" && i === 0 && entry.points > 0;
              const isMe = entry.userId === user?.id;

              return (
                <div
                  key={entry.userId}
                  className={`relative flex items-center justify-between gap-3 sm:gap-4 px-4 py-3 sm:py-4 rounded-2xl transition-all ${isFirst ? "bg-white/[0.06] shadow-sm" : "hover:bg-white/[0.02]"
                    }`}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${isFirst ? "bg-yellow-500 text-slate-900 shadow-md shadow-yellow-500/20 text-sm" :
                        sortBy === "points" && i === 1 && entry.points > 0 ? "bg-slate-300 text-slate-900 text-sm" :
                          sortBy === "points" && i === 2 && entry.points > 0 ? "bg-amber-700 text-white text-sm" :
                            "bg-white/5 text-slate-400 text-xs"
                      }`}>
                      {sortBy === "points" ? i + 1 : "-"}
                    </div>

                    {entry.avatarUrl ? (
                      <img src={entry.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-brand-600/30 flex items-center justify-center flex-shrink-0 text-brand-400 font-bold ring-2 ring-brand-500/20">
                        {entry.fullName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-[15px] font-semibold text-white truncate break-words">
                          {entry.fullName} {entry.trophies > 0 && <span className="ml-1 text-sm bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-md font-bold">🏆 {entry.trophies}</span>}
                          {isMe && <span className="ml-2 text-[10px] text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">{t("you")}</span>}
                          {entry.role === "admin" && <span className="ml-2 text-[10px] text-slate-400 bg-white/5 px-1.5 py-0.5 rounded uppercase tracking-wider">{t("admin")}</span>}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{formatPoints(entry.points, language as 'en' | 'es')} {t("points")}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 sm:gap-5 flex-shrink-0">
                    <div className="text-right">
                      <p className={`text-base font-bold ${isFirst ? "text-success" : "text-slate-300"}`}>
                        ${share.toFixed(2)}
                      </p>
                    </div>

                    {/* Admin Kick Action */}
                    {isAdmin && !isMe && (
                      <button
                        onClick={() => setKickConfirm({ userId: entry.userId, name: entry.fullName })}
                        disabled={removeMember.isPending}
                        className="p-2 text-slate-500 hover:text-danger active:text-danger hover:bg-danger/10 rounded-xl transition-colors disabled:opacity-50"
                        title="Remove member"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M22 10.5h-6m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          null
        )}
      </div>

      {isAdmin && (
        <>
          <button
            onClick={() => setShowEndModal(true)}
            disabled={endPeriod.isPending}
            className="w-full py-4 bg-white/5 hover:bg-warning/20 active:bg-warning/30 text-warning border border-warning/20 rounded-2xl font-bold transition-all shadow-sm"
          >
            {endPeriod.isPending ? t("settling_period") : t("end_period")}
          </button>
          <EndSeasonModal
            isOpen={showEndModal}
            onClose={() => setShowEndModal(false)}
            onConfirm={() => {
              setShowEndModal(false);
              endPeriod.mutate({ roomId });
            }}
            roomId={roomId}
            room={room}
          />
        </>
      )}

      <DeleteTaskModal
        isOpen={!!kickConfirm}
        taskTitle={kickConfirm?.name ?? ""}
        isPending={removeMember.isPending}
        overrideTitle={t("remove_member_title")}
        overrideDescription={t("remove_member_desc").replace("{name}", kickConfirm?.name ?? "")}
        overrideConfirmLabel={t("remove_member_confirm")}
        onConfirm={() => {
          if (kickConfirm) {
            removeMember.mutate({ roomId, userIdToRemove: kickConfirm.userId });
          }
          setKickConfirm(null);
        }}
        onClose={() => setKickConfirm(null)}
      />
    </div>
  );
}
