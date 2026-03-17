"use client";

import { useAtom, useAtomValue } from "jotai";
import { currentRoomIdAtom, taskFilterAtom, type TaskFilter } from "@/store/atoms";
import { useAuth } from "@/hooks/useAuth";
import { useTaskInstances } from "@/hooks/queries/useTasks";
import { useRoom, useRoomMembers } from "@/hooks/queries/useRooms";
import { useClaimTask, useUnclaimTask, useCompleteTask, useCreateTaskTemplate, useDeleteTask, useEditTaskTemplate } from "@/hooks/mutations/useTaskMutations";
import { useState } from "react";
import { DraggableDrawer } from "@/components/DraggableDrawer";
import { PointLimitModal } from "@/components/PointLimitModal";

// ─── Task Card ───────────────────────────────────────────────
function TaskCard({ task, userId, isAdmin }: { task: any; userId: string; isAdmin: boolean }) {
  const claimTask = useClaimTask();
  const unclaimTask = useUnclaimTask();
  const completeTask = useCompleteTask();
  const deleteTask = useDeleteTask();
  const [showOptions, setShowOptions] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; type: "point_limit_exceeded" | "too_early" | "claim_limit_warning"; details?: any } | null>(null);

  const handleClaim = async () => {
    try {
      await claimTask.mutateAsync({ taskId: task.id, userId });
    } catch (err: any) {
      if (err.code === "claim_limit_warning") {
        setErrorModal({
          isOpen: true,
          type: "claim_limit_warning",
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
              <span className="inline-flex items-center gap-1.25 px-2 py-1 bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-bold uppercase tracking-wider rounded-md">
                {task.points_reward} pts
              </span>
              <span className="text-slate-500 text-xs flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
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
                    Drop
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={handleClaim}
                disabled={claimTask.isPending}
                className="px-4 py-2 bg-brand-600/20 hover:bg-brand-600/30 active:bg-brand-600/40 text-brand-400 text-sm font-semibold rounded-xl transition-all"
              >
                Claim
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
                  Edit
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
                    {deleteTask.isPending ? "Deleting..." : "Delete"}
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
            Mark Completed
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
  const editTemplate = useEditTaskTemplate();
  const template = task.template;
  const initialRecurrence = template?.recurrence_pattern || { type: "none" };

  const [form, setForm] = useState({
    title: template?.title || task.title || "",
    description: template?.description || task.description || "",
    pointsReward: template?.points_reward || task.points_reward || 10,
    isRepeating: initialRecurrence.type !== "none",
    recurrenceType: (initialRecurrence.type === "none" ? "weekly" : initialRecurrence.type) as "daily" | "weekly" | "biweekly" | "monthly",
    weeklyDays: (initialRecurrence.days as number[]) || [], // 0=Sun, 1=Mon, ..., 6=Sat
    spawnOnCompletion: template?.spawn_on_completion || false,
    startsToday: false,
  });

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(day)
        ? prev.weeklyDays.filter((d) => d !== day)
        : [...prev.weeklyDays, day].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let recurrencePattern: { type: string; days?: number[] };
    let startDateString: string | undefined = undefined;

    if (!form.isRepeating) {
      recurrencePattern = { type: "none" };
    } else {
      if (form.recurrenceType === "weekly" && form.weeklyDays.length > 0) {
        recurrencePattern = { type: "weekly", days: form.weeklyDays };
      } else {
        recurrencePattern = { type: form.recurrenceType };
      }

      if (!form.startsToday) {
        const date = new Date();
        if (form.recurrenceType === "daily") date.setDate(date.getDate() + 1);
        else if (form.recurrenceType === "weekly") date.setDate(date.getDate() + 7);
        else if (form.recurrenceType === "biweekly") date.setDate(date.getDate() + 14);
        else if (form.recurrenceType === "monthly") date.setMonth(date.getMonth() + 1);
        startDateString = date.toISOString();
      }
    }

    await editTemplate.mutateAsync({
      templateId: template.id,
      title: form.title,
      description: form.description,
      pointsReward: form.pointsReward,
      recurrencePattern,
      spawnOnCompletion: form.isRepeating ? form.spawnOnCompletion : false,
      startDate: startDateString,
    });
    onClose();
  };

  return (
    <DraggableDrawer onClose={onClose}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Edit Task</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 pb-8">
        <div>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
            placeholder="E.g. Take out the trash"
          />
        </div>
        <div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none h-24 transition-all"
            placeholder="Any specific instructions?"
          />
        </div>

        {/* Points */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Points</label>
          <input
            type="number"
            min={1}
            required
            value={form.pointsReward}
            onChange={(e) => setForm({ ...form, pointsReward: parseInt(e.target.value) })}
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
            One-time
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, isRepeating: true })}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              form.isRepeating ? "bg-white/10 text-white shadow" : "text-slate-500"
            }`}
          >
            Repeating
          </button>
        </div>

        {/* Recurrence Options (only visible when Repeating) */}
        {form.isRepeating && (
          <div className="space-y-4 animate-fade-in">
            {/* Type selector */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Frequency</label>
              <div className="grid grid-cols-4 gap-2">
                {(["daily", "weekly", "biweekly", "monthly"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, recurrenceType: type })}
                    className={`px-2 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      form.recurrenceType === type
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {type === "biweekly" ? "Bi-weekly" : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Day-of-week picker (only for weekly) */}
            {form.recurrenceType === "weekly" && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  On specific days <span className="text-slate-500">(optional)</span>
                </label>
                <div className="flex justify-between gap-1.5">
                  {DAY_LABELS.map((label, idx) => (
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
              onClick={() => setForm({ ...form, startsToday: !form.startsToday })}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-4 transition-all hover:bg-white/[0.07]"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Starts Today</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  If off, first task delayed to next cycle
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
                <p className="text-sm font-semibold text-white">Spawn next only after completion</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Next task due date is calculated from when you finish, not the original schedule.
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
            {editTemplate.isPending ? "Saving..." : "Save Changes"}
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
  const createTemplate = useCreateTaskTemplate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    pointsReward: 10,
    isRepeating: true,
    recurrenceType: "weekly" as "daily" | "weekly" | "biweekly" | "monthly",
    weeklyDays: [] as number[], // 0=Sun, 1=Mon, ..., 6=Sat
    spawnOnCompletion: false,
    startsToday: true,
  });

  const toggleDay = (day: number) => {
    setForm((prev) => ({
      ...prev,
      weeklyDays: prev.weeklyDays.includes(day)
        ? prev.weeklyDays.filter((d) => d !== day)
        : [...prev.weeklyDays, day].sort(),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let recurrencePattern: { type: string; days?: number[] };
    let startDateString: string | undefined = undefined;

    if (!form.isRepeating) {
      recurrencePattern = { type: "none" };
    } else {
      if (form.recurrenceType === "weekly" && form.weeklyDays.length > 0) {
        recurrencePattern = { type: "weekly", days: form.weeklyDays };
      } else {
        recurrencePattern = { type: form.recurrenceType };
      }

      if (!form.startsToday) {
        const date = new Date();
        if (form.recurrenceType === "daily") date.setDate(date.getDate() + 1);
        else if (form.recurrenceType === "weekly") date.setDate(date.getDate() + 7);
        else if (form.recurrenceType === "biweekly") date.setDate(date.getDate() + 14);
        else if (form.recurrenceType === "monthly") date.setMonth(date.getMonth() + 1);
        startDateString = date.toISOString();
      }
    }

    await createTemplate.mutateAsync({
      roomId,
      title: form.title,
      description: form.description,
      pointsReward: form.pointsReward,
      recurrencePattern,
      spawnOnCompletion: form.isRepeating ? form.spawnOnCompletion : false,
      userId,
      startDate: startDateString,
    });
    onClose();
  };

  return (
    <DraggableDrawer onClose={onClose}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">New Task</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div>
          <input
            type="text"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all font-medium"
            placeholder="E.g. Take out the trash"
          />
        </div>
        <div>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 resize-none h-24 transition-all"
            placeholder="Any specific instructions?"
          />
        </div>

        {/* Points */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Points</label>
          <input
            type="number"
            min={1}
            required
            value={form.pointsReward}
            onChange={(e) => setForm({ ...form, pointsReward: parseInt(e.target.value) })}
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
            One-time
          </button>
          <button
            type="button"
            onClick={() => setForm({ ...form, isRepeating: true })}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              form.isRepeating ? "bg-white/10 text-white shadow" : "text-slate-500"
            }`}
          >
            Repeating
          </button>
        </div>

        {/* Recurrence Options (only visible when Repeating) */}
        {form.isRepeating && (
          <div className="space-y-4 animate-fade-in">
            {/* Type selector */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">Frequency</label>
              <div className="grid grid-cols-4 gap-2">
                {(["daily", "weekly", "biweekly", "monthly"] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm({ ...form, recurrenceType: type })}
                    className={`px-2 py-2.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                      form.recurrenceType === type
                        ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {type === "biweekly" ? "Bi-weekly" : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Day-of-week picker (only for weekly) */}
            {form.recurrenceType === "weekly" && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-fade-in">
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
                  On specific days <span className="text-slate-500">(optional)</span>
                </label>
                <div className="flex justify-between gap-1.5">
                  {DAY_LABELS.map((label, idx) => (
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
              onClick={() => setForm({ ...form, startsToday: !form.startsToday })}
              className="w-full flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-4 py-4 transition-all hover:bg-white/[0.07]"
            >
              <div className="text-left">
                <p className="text-sm font-semibold text-white">Starts Today</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  If off, first task delayed to next cycle
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
                <p className="text-sm font-semibold text-white">Spawn next only after completion</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Next task due date is calculated from when you finish, not the original schedule.
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
            {createTemplate.isPending ? "Creating..." : "Create Task"}
          </button>
        </div>
      </form>
    </DraggableDrawer>
  );
}

// ─── Main Tasks Page ─────────────────────────────────────────
export default function TasksPage() {
  const { user } = useAuth();
  const roomId = useAtomValue(currentRoomIdAtom);
  const [filter, setFilter] = useAtom(taskFilterAtom);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: room, isLoading: roomLoading } = useRoom(roomId);
  const { data: members } = useRoomMembers(roomId);
  const { data: tasks, isLoading: tasksLoading } = useTaskInstances(roomId, filter, user?.id);

  const currentUserRole = members?.find((m: any) => m.user_id === user?.id)?.role;

  const filters: { label: string; value: TaskFilter }[] = [
    { label: "All", value: "all" },
    { label: "Unassigned", value: "unassigned" },
    { label: "Mine", value: "mine" },
  ];

  if (!roomId && !roomLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-24 h-24 rounded-3xl bg-white/5 flex items-center justify-center mb-6 border border-white/10">
          <svg className="w-10 h-10 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205 3 1m1.5.5-1.5-.5M6.75 7.364V3h-3v18m3-13.636 10.5-3.819" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Room Selected</h2>
        <p className="text-slate-400 mb-8 max-w-sm">Create a new household or join one from your Profile tab to start tracking chores.</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="mb-6 pt-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Pending Tasks</h1>
        {room && <p className="text-sm font-medium text-brand-400 mt-1">{room.name}</p>}
      </div>

      {/* Scrollable Filter Pills */}
      <div className="flex overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 gap-2 hide-scrollbar">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`whitespace-nowrap px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-sm ${
              filter === f.value
                ? "bg-brand-600 text-white"
                : "bg-white/5 text-slate-400 hover:text-white border border-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-3 sm:space-y-4 pb-20">
        {tasksLoading ? (
          [1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-white/[0.03] border border-white/[0.06] rounded-2xl animate-pulse" />)
        ) : tasks && tasks.length > 0 ? (
          tasks.map((task) => <TaskCard key={task.id} task={task} userId={user?.id ?? ""} isAdmin={currentUserRole === "admin"} />)
        ) : (
          <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-3xl mt-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="text-slate-400 font-medium">No pending tasks here!</p>
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
