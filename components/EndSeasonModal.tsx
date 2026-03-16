"use client";

import { useLeaderboard } from "@/hooks/queries/useTasks";
import { useEndPeriod } from "@/hooks/mutations/useTaskMutations";
import { useRoomMembers } from "@/hooks/queries/useRooms";
import { Tables } from "@/types/database";

type Room = Tables<"rooms">;

export function EndSeasonModal({ room, onClose }: { room: Room, onClose: () => void }) {
  const { data: leaderboard, isLoading: lbLoading } = useLeaderboard(room.id, room.current_period_start_date);
  const { data: members, isLoading: membersLoading } = useRoomMembers(room.id);
  const endPeriod = useEndPeriod();

  const totalPoints = leaderboard?.reduce((sum, u) => sum + u.points, 0) ?? 0;
  const memberCount = members?.length ?? 0;
  const totalPool = (room.contribution_per_member || 0) * memberCount;

  const winner = leaderboard && leaderboard.length > 0 && leaderboard[0].points > 0 ? leaderboard[0] : null;

  const handleEndSeason = async () => {
    await endPeriod.mutateAsync({ roomId: room.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -z-10" />
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/20">
            <span className="text-3xl">🏆</span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Season Ended!</h2>
          <p className="text-slate-400 mt-1">{room.name}</p>
        </div>

        {lbLoading || membersLoading ? (
          <div className="flex justify-center p-8"><div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"/></div>
        ) : (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-4">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Season Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Total Points</p>
                  <p className="text-xl font-bold text-white">{totalPoints}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Pool</p>
                  <p className="text-xl font-bold text-success">${totalPool.toFixed(2)}</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-brand-500/10 to-violet-500/10 border border-brand-500/20 rounded-2xl p-4 text-center">
              <h3 className="text-xs font-semibold text-brand-300 uppercase tracking-wider mb-2">Winner</h3>
              {winner ? (
                <div>
                  <p className="text-xl font-bold text-white">{winner.fullName}</p>
                  <p className="text-sm text-brand-400 font-medium">Takes home ${totalPool.toFixed(2)}</p>
                </div>
              ) : (
                <p className="text-slate-400 font-medium">No points earned this season.</p>
              )}
            </div>

            <button
              onClick={handleEndSeason}
              disabled={endPeriod.isPending}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-[0.98] disabled:opacity-50"
            >
              {endPeriod.isPending ? "Settling..." : "Confirm & End Season"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
