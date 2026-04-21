"use client";

import { useAtomValue } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useCompletedTasks } from "@/hooks/queries/useTasks";
import { useRoom } from "@/hooks/queries/useRooms";
import { usePastSeasons } from "@/hooks/queries/useSeasonData";
import { useUncompleteTask } from "@/hooks/mutations/useTaskMutations";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatPoints } from "@/lib/numberUtils";
import { formatTaskDate } from "@/lib/dateUtils";
import { getPointColorClasses } from "@/lib/pointsColor";
import { formatSeasonLabel } from "@/lib/seasonLabel";
import { TaskDetailsDrawer } from "@/components/TaskDetailsDrawer";
import Link from "next/link";

type HistoryMode = "recent" | "seasons";

export default function HistoryPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const roomId = useAtomValue(currentRoomIdAtom);
  const [mode, setMode] = useState<HistoryMode>("recent");
  const [loadCount, setLoadCount] = useState(20);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const { data: tasks, isLoading } = useCompletedTasks(roomId, loadCount);
  const { data: room } = useRoom(roomId);
  const { data: pastSeasons, isLoading: seasonsLoading } = usePastSeasons(roomId);
  const uncompleteTask = useUncompleteTask();

  if (!roomId) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">{t("select_room_history")}</p>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-2">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("history")}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            {mode === "recent" ? t("last_7_days") : t("past_seasons")}
          </p>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center bg-white/5 rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode("recent")}
          className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === "recent"
              ? "bg-white/10 text-white shadow"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {t("recent_tasks")}
        </button>
        <button
          onClick={() => setMode("seasons")}
          className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            mode === "seasons"
              ? "bg-white/10 text-white shadow"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {t("past_seasons")}
        </button>
      </div>

      {mode === "recent" ? (
        /* === RECENT TASKS MODE === */
        <>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white/[0.03] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : tasks && tasks.length > 0 ? (
            <>
              <div className="space-y-3">
                {tasks.map((task) => {
                  const completer = task.profiles as unknown as { full_name: string | null; avatar_url: string | null } | null;
                  return (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTask(task)}
                      className="flex items-start sm:items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-4 sm:p-5 animate-fade-in cursor-pointer hover:bg-white/[0.05] transition-colors"
                    >
                      <div className="w-10 h-10 rounded-[14px] bg-success/15 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
                        <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-[15px] sm:text-base line-through opacity-60 leading-tight">{task.title}</h3>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-[11px] sm:text-xs text-slate-500 font-medium tracking-wide">
                          <span className={`${getPointColorClasses(task.points_reward, room?.point_limit ?? null).text}`}>{formatPoints(task.points_reward, language as 'en' | 'es')} {t("pts")}</span>
                          <span>•</span>
                          <span>
                            {t("by")}{" "}
                            <span className="text-slate-400">
                              {completer?.full_name || "Unknown"}
                            </span>
                          </span>
                          {task.completed_at && (
                            <>
                              <span>•</span>
                              <span className="capitalize">{formatTaskDate(task.completed_at, language as 'en' | 'es')}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          uncompleteTask.mutate({ taskId: task.id });
                        }}
                        disabled={uncompleteTask.isPending}
                        className="p-2.5 text-slate-500 hover:text-warning active:text-warning hover:bg-warning/10 active:bg-warning/15 rounded-xl transition-all -mr-1 sm:mr-0 flex-shrink-0"
                        title={t("mark_as_incomplete")}
                      >
                        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                      </button>
                    </div>
                  );
                })}
              </div>

              {tasks.length >= loadCount && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => setLoadCount((c) => c + 20)}
                    className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 active:bg-white/15 text-white rounded-2xl font-bold transition-colors border border-white/5"
                  >
                    {t("load_more")}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/5 rounded-[28px]">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-white/5 items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">{t("no_completed_tasks")}</p>
            </div>
          )}
        </>
      ) : (
        /* === PAST SEASONS MODE === */
        <>
          {seasonsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white/[0.03] rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : pastSeasons && pastSeasons.length > 0 ? (
            <div className="space-y-3">
              {pastSeasons.map((season) => {
                const winner = (season as any).winner as { full_name: string | null; avatar_url: string | null } | null;
                const hasData = season.total_points > 0;
                return (
                  <Link
                    key={season.id}
                    href={`/dashboard/history/${season.id}`}
                    className={`block bg-white/[0.03] border border-white/[0.06] rounded-[20px] p-5 transition-all hover:bg-white/[0.06] hover:border-white/[0.10] ${
                      !hasData ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Season icon */}
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          hasData
                            ? "bg-gradient-to-br from-brand-500/20 to-indigo-500/20 border border-brand-500/20"
                            : "bg-white/5 border border-white/5"
                        }`}>
                          <svg className={`w-6 h-6 ${hasData ? "text-brand-400" : "text-slate-600"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 6.75h13.5" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-base font-bold text-white">
                            {formatSeasonLabel(season.period_start, season.period_end, language as 'en' | 'es')}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                            {hasData && (
                              <>
                                <span className="text-brand-400 font-semibold">{formatPoints(season.total_points, language as 'en' | 'es')} {t("pts")}</span>
                                <span>•</span>
                              </>
                            )}
                            <span>${Number(season.total_pool).toFixed(2)}</span>
                            {winner?.full_name && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  🏆 <span className="text-slate-400">{winner.full_name}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      {/* Arrow */}
                      <svg className="w-5 h-5 text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                      </svg>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 px-4 bg-white/[0.02] border border-white/5 rounded-[28px]">
              <div className="inline-flex w-16 h-16 rounded-2xl bg-white/5 items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 6.75h13.5" />
                </svg>
              </div>
              <p className="text-slate-400 font-medium">{t("no_past_seasons")}</p>
            </div>
          )}
        </>
      )}

      {selectedTask && (
        <TaskDetailsDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );

}
