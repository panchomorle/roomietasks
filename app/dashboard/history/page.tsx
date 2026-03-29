"use client";

import { useAtomValue } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useCompletedTasks } from "@/hooks/queries/useTasks";
import { useRoom } from "@/hooks/queries/useRooms";
import { useUncompleteTask } from "@/hooks/mutations/useTaskMutations";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatPoints } from "@/lib/numberUtils";
import { formatTaskDate } from "@/lib/dateUtils";
import { getPointColorClasses } from "@/lib/pointsColor";
import { TaskDetailsDrawer } from "@/components/TaskDetailsDrawer";

export default function HistoryPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const roomId = useAtomValue(currentRoomIdAtom);
  const [loadCount, setLoadCount] = useState(20);
  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const { data: tasks, isLoading } = useCompletedTasks(roomId, loadCount);
  const { data: room } = useRoom(roomId);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("completed")}</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">{t("last_7_days")}</p>
        </div>
        <LanguageSwitcher />
      </div>

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

      {selectedTask && (
        <TaskDetailsDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );

}
