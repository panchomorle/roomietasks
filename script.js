const fs = require('fs');
const code = \"use client";

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
  const totalTasks = leaderboard?.reduce((sum, u) => sum + u.tasksCompleted, 0) ?? 0;
  const memberCount = members?.length ?? 0;
  const totalPool = (room.contribution_per_member || 0) * memberCount;

  const handleEndSeason = async () => {
    await endPeriod.mutateAsync({ roomId: room.id });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl overflow-y-auto max-h-[90vh] relative scrollbar-hide">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl -z-10" />
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">✕</button>
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
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-slate-500">Tasks Done</p>
                  <p className="text-lg font-bold text-white">{totalTasks}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Points</p>
                  <p className="text-lg font-bold text-white">{totalPoints}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Pool</p>
                  <p className="text-lg font-bold text-success">$\</p>
                </div>
              </div>
            </div>

            {leaderboard && leaderboard.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">Podium & Payouts</h3>
                {leaderboard.slice(0, 3).map((user, idx) => {
                  const share = totalPoints > 0 ? (user.points / totalPoints) * totalPool : 0;
                  const isFirst = idx === 0;
                  return (
                    <div key={user.userId} className={\lex items-center justify-between p-3 rounded-xl border \ \}> 
                      <div className="flex items-center gap-3">
                        <div className={\w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 \ \}> 
                          #\
                        </div>
                        <div className="flex flex-col items-start truncate">
                          <p className="font-semibold text-white truncate max-w-[120px] sm:max-w-[140px]">{user.fullName}</p>
                          <p className="text-xs text-slate-400">\ tasks • \ pts</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={\ont-bold \ \}>
                          $\
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={handleEndSeason}
              disabled={endPeriod.isPending}
              className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-500/25 active:scale-[0.98] disabled:opacity-50 mt-4"
            >
              {endPeriod.isPending ? "Settling..." : "Confirm & Divide Money"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}\;
fs.writeFileSync('c:/Users/eljua/Documents/dev/roomietasks/components/EndSeasonModal.tsx', code);
