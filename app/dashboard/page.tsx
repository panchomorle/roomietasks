"use client";

import { useAtom, useAtomValue } from "jotai";
import { currentRoomIdAtom, taskFilterAtom, taskSortAtom, type TaskFilter, type TaskSort } from "@/store/atoms";
import { useAuth } from "@/hooks/useAuth";
import { useTaskInstances } from "@/hooks/queries/useTasks";
import { useRoom, useRoomMembers } from "@/hooks/queries/useRooms";
import { useClaimTask, useUnclaimTask, useCompleteTask, useCreateTaskTemplate, useDeleteTask, useEditTaskTemplate } from "@/hooks/mutations/useTaskMutations";
import { useState } from "react";
import { DraggableDrawer } from "@/components/DraggableDrawer";
import { PointLimitModal } from "@/components/PointLimitModal";

import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatTaskDate, computeCycleCutoff } from "@/lib/dateUtils";
import { formatPoints } from "@/lib/numberUtils";

import { getPointColorClasses } from "@/lib/pointsColor";

// ─── Task Card ───────────────────────────────────────────────
function TaskCard({ task, userId, isAdmin, pointLimit }: { task: any; userId: string; isAdmin: boolean; pointLimit: number | null }) {
  const { t, language } = useTranslation();
  const claimTask = useClaimTask();
  const unclaimTask = useUnclaimTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const [showOptions, setShowOptions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; type: "point_limit_exceeded" | "too_early" | "claim_limit_warning" | "claim_cooldown_active"; details?: any } | null>(null);

  const handleClaim = async () => {
    try {
      await claimTask.mutateAsync({ taskId: task.id, userId });
    } catch (err: any) {
      if (err.code === "claim_limit_warning" || err.code === "claim_cooldown_active") {
        setErrorModal({
          isOpen: true,
          type: err.code as any,
          details: err.details
        });
      } else {
        alert(err.message || "Failed to claim task");
      }
    }
  };

  const handleComplete = async () => {
    try {
      await completeTask.mutateAsync({ taskId: task.id, userId });
    } catch (err: any) {
      if (err.code === "point_limit_exceeded" || err.code === "too_early") {
        setErrorModal({
          isOpen: true,
          type: err.code as any,
          details: err.details
        });
      } else {
        alert(err.message || "Failed to complete task");
      }
    }
  };

  const isAssigned = !!task.assigned_user_id;
  const isAssignedToMe = task.assigned_user_id === userId;
  const assignedProfile = task.profiles as { full_name: string | null; avatar_url: string | null } | null;

  // Normalizing to midnight to avoid false positives for "today"
  const taskDate = new Date(task.due_date);
  const dateMidnight = new Date(taskDate.getUTCFullYear(), taskDate.getUTCMonth(), taskDate.getUTCDate());
  const now = new Date();
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const isExpired = dateMidnight < nowMidnight;

  return (
    <>
      <div className="group relative bg-white/[0.04] active:bg-white/[0.08] sm:hover:bg-white/[0.06] border border-white/[0.06] rounded-2xl p-4 sm:p-5 transition-all duration-200 animate-fade-in shadow-sm">
        <div className="flex items-start justify-between gap-3 sm:gap-4 pr-6">
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-[15px] sm:text-base leading-snug">{task.title}</h3>
            {task.description && (
              <p className="text-slate-400 text-xs sm:text-sm mt-1 line-clamp-2">{task.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`inline-flex items-center gap-1.25 px-2 py-1 ${getPointColorClasses(task.points_reward, pointLimit).bg} border ${getPointColorClasses(task.points_reward, pointLimit).border} ${getPointColorClasses(task.points_reward, pointLimit).text} text-[11px] font-bold uppercase tracking-wider rounded-md`}>
                {formatPoints(task.points_reward, language as "en" | "es")} pts
              </span>
              <span className={`text-xs flex items-center gap-1 ${isExpired ? "text-red-500 font-semibold" : "text-slate-500"}`}>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="capitalize">{formatTaskDate(task.due_date, language as "en" | "es")}</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
            {isAssigned ? (
              <div className="flex items-center gap-2">
                {assignedProfile?.avatar_url ? (
                  <img src={assignedProfile.avatar_url} alt="" className="w-8 h-8 rounded-full ring-2 ring-brand-500/30 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 text-xs font-bold ring-2 ring-brand-500/30">
                    {assignedProfile?.full_name?.charAt(0) || "?"}
                  </div>
                )}
                {isAssignedToMe && (
                  <button
                    onClick={() => unclaimTask.mutate({ taskId: task.id })}
                    className="text-xs font-medium text-slate-500 hover:text-red-400 active:text-red-400 px-2 py-1"
                  >
                    {t("drop")}
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claimTask.isPending}
                className="px-4 py-2 bg-brand-600/20 hover:bg-brand-600/30 active:bg-brand-600/40 text-brand-400 text-sm font-semibold rounded-xl transition-all"
              >
                {t("claim")}
              </button>
            )}
          </div>
        </div>

        {/* Options Menu */}
        <div className="absolute top-3 right-2 sm:top-4 sm:right-3">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
            </svg>
          </button>
          {showOptions && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowOptions(false)} 
              />
              <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in">
                <button
                  onClick={() => {
                    setShowOptions(false);
                    setShowEdit(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                  {t("edit_task")}
                </button>
                {isAdmin && (
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this task instance?")) {
                        deleteTask.mutate({ taskId: task.id });
                      }
                      setShowOptions(false);
                    }}
                    disabled={deleteTask.isPending}
                    className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors flex items-center gap-2 border-t border-white/5"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                    {deleteTask.isPending ? t("deleting") : t("delete")}
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Complete Button (Full width on mobile if assigned to me) */}
        {isAssignedToMe && (
          <button
            onClick={handleComplete}
            disabled={completeTask.isPending}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-success/15 hover:bg-success/25 active:bg-success/30 text-success rounded-xl font-bold transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            {t("mark_completed")}
          </button>
        )}
      </div>

      {showEdit && (
        <EditTaskDrawer 
          task={task} 
          onClose={() => setShowEdit(false)} 
        />
      )}

      {errorModal && (
        <PointLimitModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal(null)}
          errorType={errorModal.type}
          details={errorModal.details}
          taskId={task.id}
          userId={userId}
        />
      )}
    </>
  );
}

// ─── Edit Task Drawer ────────────────────────────────────────
function EditTaskDrawer({ task, onClose }: { task: any; onClose: () => void }) {
  const { t } = useTranslation();
  const editTemplate = useEditTaskTemplate();
  const template = task.template;
  const initialRecurrence = template?.recurrence_pattern || { type: "none" };

  const [form, setForm] = useState({
    title: template?.title || task.title || "",
    description: template?.description || task.description || "",
    pointsReward: String(template?.points_reward || task.points_reward || 10),
    isRepeating: initialRecurrence.type !== "none",
    recurrenceType: (initialRecurrence.type === "none" ? "weekly" : initialRecurrence.type) as "daily" | "weekly" | "biweekly" | "monthly",
    weeklyDays: (initialRecurrence.days as number[]) || [], // 0=Sun, 1=Mon, ..., 6=Sat
    spawnOnCompletion: template?.spawn_on_completion || false,
    startsToday: false,
    customDate: (() => { const d = new Date(task.due_date); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); })(),
  });

  const updateDefaultStartDate = (recurrenceType: string, weeklyDays: number[] = form.weeklyDays) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (recurrenceType === "daily") {
      date.setDate(date.getDate() + 1);
    } else if (recurrenceType === "weekly") {
      if (weeklyDays.length > 0) {
        let nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        let found = false;
        for (let i = 0; i < 7; i++) {
          if (weeklyDays.includes(nextDate.getDay())) {
            date.setTime(nextDate.getTime());
            found = true;
            break;
          }
          nextDate.setDate(nextDate.getDate() + 1);
        }
        if (!found) date.setDate(date.getDate() + 7);
      } else {
        date.setDate(date.getDate() + 7);
      }
    } else if (recurrenceType === "biweekly") {
      date.setDate(date.getDate() + 14);
    } else if (recurrenceType === "monthly") {
      date.setMonth(date.getMonth() + 1);
    }
    setForm(prev => ({ ...prev, customDate: date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0') }));
  };

  const toggleDay = (day: number) => {
    const nextWeeklyDays = form.weeklyDays.includes(day)
      ? form.weeklyDays.filter((d) => d !== day)
      : [...form.weeklyDays, day].sort();
    
    setForm((prev) => ({
      ...prev,
      weeklyDays: nextWeeklyDays,
    }));

    if (!form.startsToday && form.recurrenceType === "weekly") {
      updateDefaultStartDate("weekly", nextWeeklyDays);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let recurrencePattern: { type: string; days?: number[] };
    let startDateString: string | undefined = undefined;

    if (form.isRepeating) {
      if (form.recurrenceType === "weekly" && form.weeklyDays.length > 0) {
        recurrencePattern = { type: "weekly", days: form.weeklyDays };
      } else {
        recurrencePattern = { type: form.recurrenceType };
      }

      if (!form.startsToday) {
        startDateString = new Date(form.customDate).toISOString();
      }
    } else {
      // For one-time tasks, we use the customDate as the start date for generating the instance
      startDateString = new Date(form.customDate).toISOString();
      recurrencePattern = { type: "none" };
    }

    await editTemplate.mutateAsync({
      templateId: template.id,
      title: form.title,
      description: form.description,
      pointsReward: parseFloat(form.pointsReward as string) || 0,
      recurrencePattern,
      spawnOnCompletion: form.isRepeating ? form.spawnOnCompletion : false,
      startDate: startDateString,
    });
    onClose();
  };

  return (
    <DraggableDrawer onClose={onClose}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">{t("edit_task")}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-8">
        <div>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
            placeholder={t("task_title_placeholder")}
          />
        </div>
        <div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none h-24 transition-all"
            placeholder={t("any_instructions")}
          />
        </div>

        {/* Points */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("points_label")}</label>
          <input
            type="number"
            step="0.01" 
            min={0.01} 
            max={9999}
            required
            value={form.pointsReward}
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
            onChange={(e) => {
              let val = e.target.value;
              if (val && !/^\d*\.?\d{0,2}$/.test(val)) {
                const parts = val.split('.');
                val = parts[0] + '.' + parts[1].slice(0, 2);
              }
              if (parseFloat(val) > 9999) val = "9999";
              setForm({ ...form, pointsReward: val });
            }}
            className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
          />
        </div>

        {/* Repeating Toggle */}
        <div className="flex items-center bg-white/5 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setForm({ ...form, isRepeating: false })}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              !form.isRepeating ? "bg-white/10 text-white shadow" : "text-slate-500"
            }`}
          >
            {t("one_time")}
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, isRepeating: true })}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              form.isRepeating ? "bg-white/10 text-white shadow" : "text-slate-500"
            }`}
          >
            {t("repeating")}
          </button>
        </div>

        {/* Custom Due Date for One-time Task */}
        {!form.isRepeating && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("due_date_label")}</label>
            <input
              type="date"
              required
              value={form.customDate}
              onChange={(e) => setForm({ ...form, customDate: e.target.value })}
              className="w-full bg-transparent text-lg font-bold text-white focus:outline-none [color-scheme:dark]"
            />
          </div>
        )}

        {/* Recurrence Options (only visible when Repeating) */}
        {form.isRepeating && (
          <div className="space-y-4 animate-fade-in">
            {/* Type selector */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{t("frequency")}</label>
              <div className="grid grid-cols-4 gap-2">
                {(["daily", "weekly", "biweekly", "monthly"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, recurrenceType: type });
                      if (!form.startsToday) updateDefaultStartDate(type);
                    }}
                    className={`px-2 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      form.recurrenceType === type
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {t(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Day-of-week picker (only for weekly) */}
            {form.recurrenceType === "weekly" && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  {t("on_specific_days")} <span className="text-slate-500">({t("optional")})</span>
                </label>
                <div className="flex justify-between gap-1.5">
                  {[t("day_s"), t("day_m"), t("day_t"), t("day_w"), t("day_th"), t("day_f"), t("day_sa")].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                        form.weeklyDays.includes(idx)
                          ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                          : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Starts Today toggle */}
            <button
              type="button"
              onClick={() => {
                const nextStartsToday = !form.startsToday;
                setForm({ ...form, startsToday: nextStartsToday });
                if (!nextStartsToday) updateDefaultStartDate(form.recurrenceType);
              }}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-4 transition-all hover:bg-white/[0.07]"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t("starts_today")}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t("starts_today_hint")}
                </p>
              </div>
              <div className={`w-11 h-6 rounded-full flex-shrink-0 transition-colors relative flex items-center px-1 ${
                form.startsToday ? "bg-brand-500" : "bg-slate-600"
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  form.startsToday ? "translate-x-5" : "translate-x-0"
                }`} />
              </div>
            </button>

            {/* Custom Start Date for Recurring Task (if not startsToday) */}
            {!form.startsToday && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("start_date_label")}</label>
                <input
                  type="date"
                  required
                  value={form.customDate}
                  onChange={(e) => setForm({ ...form, customDate: e.target.value })}
                  className="w-full bg-transparent text-lg font-bold text-white focus:outline-none [color-scheme:dark]"
                />
              </div>
            )}

            {/* Spawn on Completion toggle */}
            <button
              type="button"
              onClick={() => setForm({ ...form, spawnOnCompletion: !form.spawnOnCompletion })}
              className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-left transition-all hover:bg-white/[0.07]"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                form.spawnOnCompletion
                  ? "bg-brand-500 border-brand-500"
                  : "border-slate-600"
              }`}>
                {form.spawnOnCompletion && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t("spawn_after_completion")}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t("spawn_on_completion_hint")}
                </p>
              </div>
            </button>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={editTemplate.isPending}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {editTemplate.isPending ? t("saving") : t("save_changes")}
          </button>
        </div>
      </form>
    </DraggableDrawer>
  );
}

// ─── Create Task Slide-Up Drawer ─────────────────────────────
const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"]; // 0=Sun ... 6=Sat

function CreateTaskDrawer({
  roomId,
  userId,
  onClose,
}: {
  roomId: string;
  userId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const createTemplate = useCreateTaskTemplate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsReward: "10",
    isRepeating: true,
    recurrenceType: "weekly" as "daily" | "weekly" | "biweekly" | "monthly",
    weeklyDays: [] as number[], // 0=Sun, 1=Mon, ..., 6=Sat
    spawnOnCompletion: false,
    startsToday: true,
    customDate: new Date().getFullYear() + '-' + String(new Date().getMonth() + 1).padStart(2, '0') + '-' + String(new Date().getDate()).padStart(2, '0'),
  });

  const updateDefaultStartDate = (recurrenceType: string, weeklyDays: number[] = form.weeklyDays) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);

    if (recurrenceType === "daily") {
      date.setDate(date.getDate() + 1);
    } else if (recurrenceType === "weekly") {
      if (weeklyDays.length > 0) {
        let nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);
        let found = false;
        for (let i = 0; i < 7; i++) {
          if (weeklyDays.includes(nextDate.getDay())) {
            date.setTime(nextDate.getTime());
            found = true;
            break;
          }
          nextDate.setDate(nextDate.getDate() + 1);
        }
        if (!found) date.setDate(date.getDate() + 7);
      } else {
        date.setDate(date.getDate() + 7);
      }
    } else if (recurrenceType === "biweekly") {
      date.setDate(date.getDate() + 14);
    } else if (recurrenceType === "monthly") {
      date.setMonth(date.getMonth() + 1);
    }
    setForm(prev => ({ ...prev, customDate: date.toISOString().split('T')[0] }));
  };

  const toggleDay = (day: number) => {
    const nextWeeklyDays = form.weeklyDays.includes(day)
      ? form.weeklyDays.filter((d) => d !== day)
      : [...form.weeklyDays, day].sort();

    setForm((prev) => ({
      ...prev,
      weeklyDays: nextWeeklyDays,
    }));

    if (!form.startsToday && form.recurrenceType === "weekly") {
      updateDefaultStartDate("weekly", nextWeeklyDays);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let recurrencePattern: { type: string; days?: number[] };
    let startDateString: string | undefined = undefined;

    if (form.isRepeating) {
      if (form.recurrenceType === "weekly" && form.weeklyDays.length > 0) {
        recurrencePattern = { type: "weekly", days: form.weeklyDays };
      } else {
        recurrencePattern = { type: form.recurrenceType };
      }

      if (!form.startsToday) {
        startDateString = new Date(form.customDate).toISOString();
      }
    } else {
      // For one-time tasks, we use the customDate as the start date for generating the instance
      startDateString = new Date(form.customDate).toISOString();
      recurrencePattern = { type: "none" };
    }

    await createTemplate.mutateAsync({
      roomId,
      title: form.title,
      description: form.description,
      pointsReward: parseFloat(form.pointsReward as string) || 0,
      recurrencePattern,
      spawnOnCompletion: form.isRepeating ? form.spawnOnCompletion : false,
      userId,
      startDate: startDateString,
    });
    onClose();
  };

  return (
    <DraggableDrawer onClose={onClose}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">{t("new_task")}</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
            placeholder={t("task_title_placeholder")}
          />
        </div>
        <div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none h-24 transition-all"
            placeholder={t("any_instructions")}
          />
        </div>

        {/* Points */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("points_label")}</label>
          <input
            type="number"
            step="0.01" 
            min={0.01} 
            max={9999}
            required
            value={form.pointsReward}
            onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
            onChange={(e) => {
              let val = e.target.value;
              if (val && !/^\d*\.?\d{0,2}$/.test(val)) {
                const parts = val.split('.');
                val = parts[0] + '.' + parts[1].slice(0, 2);
              }
              if (parseFloat(val) > 9999) val = "9999";
              setForm({ ...form, pointsReward: val });
            }}
            className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
          />
        </div>

        {/* Repeating Toggle */}
        <div className="flex items-center bg-white/5 rounded-2xl p-1">
          <button
            type="button"
            onClick={() => setForm({ ...form, isRepeating: false })}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              !form.isRepeating ? "bg-white/10 text-white shadow" : "text-slate-500"
            }`}
          >
            {t("one_time")}
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, isRepeating: true })}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              form.isRepeating ? "bg-white/10 text-white shadow" : "text-slate-500"
            }`}
          >
            {t("repeating")}
          </button>
        </div>

        {/* Custom Due Date for One-time Task */}
        {!form.isRepeating && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("due_date_label")}</label>
            <input
              type="date"
              required
              value={form.customDate}
              onChange={(e) => setForm({ ...form, customDate: e.target.value })}
              className="w-full bg-transparent text-lg font-bold text-white focus:outline-none [color-scheme:dark]"
            />
          </div>
        )}

        {/* Recurrence Options (only visible when Repeating) */}
        {form.isRepeating && (
          <div className="space-y-4 animate-fade-in">
            {/* Type selector */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{t("frequency")}</label>
              <div className="grid grid-cols-4 gap-2">
                {(["daily", "weekly", "biweekly", "monthly"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setForm({ ...form, recurrenceType: type });
                      if (!form.startsToday) updateDefaultStartDate(type);
                    }}
                    className={`px-2 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      form.recurrenceType === type
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {t(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Day-of-week picker (only for weekly) */}
            {form.recurrenceType === "weekly" && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  {t("on_specific_days")} <span className="text-slate-500">({t("optional")})</span>
                </label>
                <div className="flex justify-between gap-1.5">
                  {[t("day_s"), t("day_m"), t("day_t"), t("day_w"), t("day_th"), t("day_f"), t("day_sa")].map((label, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                        form.weeklyDays.includes(idx)
                          ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                          : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Starts Today toggle */}
            <button
              type="button"
              onClick={() => {
                const nextStartsToday = !form.startsToday;
                setForm({ ...form, startsToday: nextStartsToday });
                if (!nextStartsToday) updateDefaultStartDate(form.recurrenceType);
              }}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-4 transition-all hover:bg-white/[0.07]"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-white">{t("starts_today")}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t("starts_today_hint")}
                </p>
              </div>
              <div className={`w-11 h-6 rounded-full flex-shrink-0 transition-colors relative flex items-center px-1 ${
                form.startsToday ? "bg-brand-500" : "bg-slate-600"
              }`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  form.startsToday ? "translate-x-5" : "translate-x-0"
                }`} />
              </div>
            </button>

            {/* Custom Start Date for Recurring Task (if not startsToday) */}
            {!form.startsToday && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("start_date_label")}</label>
                <input
                  type="date"
                  required
                  value={form.customDate}
                  onChange={(e) => setForm({ ...form, customDate: e.target.value })}
                  className="w-full bg-transparent text-lg font-bold text-white focus:outline-none [color-scheme:dark]"
                />
              </div>
            )}

            {/* Spawn on Completion toggle */}
            <button
              type="button"
              onClick={() => setForm({ ...form, spawnOnCompletion: !form.spawnOnCompletion })}
              className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-left transition-all hover:bg-white/[0.07]"
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                form.spawnOnCompletion
                  ? "bg-brand-500 border-brand-500"
                  : "border-slate-600"
              }`}>
                {form.spawnOnCompletion && (
                  <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{t("spawn_after_completion")}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {t("spawn_on_completion_hint")}
                </p>
              </div>
            </button>
          </div>
        )}
        
        <div className="pt-2">
          <button
            type="submit"
            disabled={createTemplate.isPending}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {createTemplate.isPending ? t("creating") : t("new_task")}
          </button>
        </div>
      </form>
    </DraggableDrawer>
  );
}

function CycleDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-4 animate-fade-in">
      <div className="flex-1 h-px bg-white/10" />
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}

function sortTasks(tasks: any[], sort: TaskSort): any[] {
  const arr = [...tasks];
  switch (sort) {
    case "due_date_asc":
      return arr.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    case "due_date_desc":
      return arr.sort((a, b) => new Date(b.due_date).getTime() - new Date(a.due_date).getTime());
    case "points_desc":
      return arr.sort((a, b) => b.points_reward - a.points_reward);
    case "points_asc":
      return arr.sort((a, b) => a.points_reward - b.points_reward);
    case "title_asc":
      return arr.sort((a, b) => a.title.localeCompare(b.title));
    case "created_at_desc":
      return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    default:
      return arr;
  }
}

// ─── Main Tasks Page ─────────────────────────────────────────
export default function TasksPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const roomId = useAtomValue(currentRoomIdAtom);
  const [filter, setFilter] = useAtom(taskFilterAtom);
  const [sort, setSort] = useAtom(taskSortAtom);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: members } = useRoomMembers(roomId);
  const { data: allTasks, isLoading: tasksLoading } = useTaskInstances(roomId, filter, sort, user?.id);

  const currentUserRole = members?.find((m: any) => m.user_id === user?.id)?.role;

  // Split and sort tasks
  const { currentCycleTasks, nextCycleTasks } = (() => {
    if (!allTasks) return { currentCycleTasks: [], nextCycleTasks: [] };
    
    if (!room || !room.current_period_start_date) {
        return { currentCycleTasks: sortTasks(allTasks, sort), nextCycleTasks: [] };
    }

    const cutoff = computeCycleCutoff(
      room.current_period_start_date,
      room.period_duration_days,
      room.cycles_per_period || 1
    );

    const current: any[] = [];
    const next: any[] = [];

    allTasks.forEach(t => {
      if (new Date(t.due_date) <= cutoff) {
        current.push(t);
      } else {
        next.push(t);
      }
    });

    return {
      currentCycleTasks: sortTasks(current, sort),
      nextCycleTasks: sortTasks(next, sort)
    };
  })();

  const filters: { label: string; value: TaskFilter }[] = [
    { label: t("all"), value: "all" },
    { label: t("unassigned"), value: "unassigned" },
    { label: t("mine"), value: "mine" },
  ];
  
  const sortOptions: { label: string; value: TaskSort }[] = [
    { label: t("due_date_asc"), value: "due_date_asc" },
    { label: t("due_date_desc"), value: "due_date_desc" },
    { label: t("points_desc"), value: "points_desc" },
    { label: t("points_asc"), value: "points_asc" },
    { label: t("title_asc"), value: "title_asc" },
    { label: t("created_at_desc"), value: "created_at_desc" },
  ];

  if (!roomId && !roomLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
          <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">{t("no_room_selected")}</h2>
        <p className="text-slate-400 mb-8 max-w-sm">{t("create_household_prompt")}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 pt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("pending_tasks")}</h1>
          {room && <p className="text-sm font-medium text-brand-400 mt-1">{room.name}</p>}
        </div>
        <LanguageSwitcher />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="flex overflow-x-auto gap-2 hide-scrollbar pb-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm flex-shrink-0 ${
                filter === f.value
                  ? "bg-brand-600 text-white"
                  : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="relative ml-auto flex-shrink-0">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className={`p-2.5 rounded-full border transition-all ${
              showSortMenu 
                ? "bg-brand-600/20 border-brand-500 text-brand-400" 
                : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list-filter"><path d="M2 5h20"/><path d="M6 12h12"/><path d="M9 19h6"/></svg>
          </button>
          
          {showSortMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowSortMenu(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-2xl shadow-2xl z-50 py-2 animate-fade-in">
                <div className="px-4 py-2 border-b border-white/5 mb-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t("order_by")}</p>
                </div>
                {sortOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSort(option.value);
                      setShowSortMenu(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${
                      sort === option.value 
                        ? "text-brand-400 bg-brand-500/10 font-medium" 
                        : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {option.label}
                    {sort === option.value && (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3 sm:space-y-4 pb-20">
        {tasksLoading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse" />)
        ) : (currentCycleTasks.length > 0 || nextCycleTasks.length > 0) ? (
          <>
            {currentCycleTasks.map((task) => (
              <TaskCard key={task.id} task={task} userId={user?.id ?? ""} isAdmin={currentUserRole === "admin"} pointLimit={room?.point_limit ?? null} />
            ))}
            
            {nextCycleTasks.length > 0 && (
              <>
                <CycleDivider label={t("next_cycle")} />
                {nextCycleTasks.map((task) => (
                  <TaskCard key={task.id} task={task} userId={user?.id ?? ""} isAdmin={currentUserRole === "admin"} pointLimit={room?.point_limit ?? null} />
                ))}
              </>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-3xl mt-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-slate-400 font-medium">{t("no_pending_tasks")}</p>
          </div>
        )}
      </div>

      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-24 right-5 sm:bottom-10 sm:right-10 w-14 h-14 bg-brand-500 text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:scale-105 active:scale-95 transition-all z-40"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>

      {showCreateModal && user && roomId && (
        <CreateTaskDrawer
          roomId={roomId}
          userId={user.id}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </>
  );
}
