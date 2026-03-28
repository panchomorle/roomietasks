"use client";

import React from "react";
import { DraggableDrawer } from "@/components/DraggableDrawer";
import { formatTaskDate } from "@/lib/dateUtils";
import { getPointColorClasses } from "@/lib/pointsColor";
import { useTranslation } from "@/hooks/useTranslation";
import { formatPoints } from "@/lib/numberUtils";
import { useAtomValue } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useRoom } from "@/hooks/queries/useRooms";

interface TaskDetailsDrawerProps {
  task: any | null;
  onClose: () => void;
}

export function TaskDetailsDrawer({ task, onClose }: TaskDetailsDrawerProps) {
  const { t, language } = useTranslation();
  const roomId = useAtomValue(currentRoomIdAtom);
  const { data: room } = useRoom(roomId);

  if (!task) return null;

  const pointColor = getPointColorClasses(task.points_reward, room?.point_limit ?? null);
  
  // Extract related profiles
  // Note: Depending on standard supabase joins, the completed_by might be under `profiles` alias or `completer`
  const completer = task.completer || task.profiles;
  const completerName = completer?.full_name || t("unknown");
  
  const template = task.template;
  const creatorName = template?.creator?.full_name || t("unknown");
  const isOneTime = !template?.recurrence_pattern || template.recurrence_pattern.type === "none";

  return (
    <DraggableDrawer onClose={onClose}>
      <div className="pt-2 px-1 pb-4">
        {/* Header Section */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-black text-white leading-tight mb-2">
              {task.title}
            </h2>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold border ${pointColor.bg} ${pointColor.border} ${pointColor.text}`}>
              {formatPoints(task.points_reward, language as 'en' | 'es')} {t("pts")}
            </div>
          </div>
          <div className="w-12 h-12 rounded-[16px] bg-success/15 flex items-center justify-center flex-shrink-0 border border-success/20">
            <svg className="w-6 h-6 text-success" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
        </div>

        {/* Description Section */}
        <div className="mb-6 bg-white/[0.03] border border-white/5 rounded-2xl p-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            {t("description") || "Description"}
          </h3>
          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
            {task.description || (t("no_description") || "No description provided.")}
          </p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Completed By */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("completed_by") || "Completed By"}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-brand-500/20 flex items-center justify-center text-[10px] font-bold text-brand-400">
                {completerName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-white truncate">{completerName}</p>
            </div>
            {task.completed_at && (
              <p className="text-xs text-slate-400 mt-1.5 capitalize">
                {formatTaskDate(task.completed_at, language as 'en' | 'es')}
              </p>
            )}
          </div>

          {/* Created By */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("created_by") || "Created By"}
            </p>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-slate-500/20 flex items-center justify-center text-[10px] font-bold text-slate-400">
                {creatorName.charAt(0).toUpperCase()}
              </div>
              <p className="text-sm font-semibold text-white truncate">{creatorName}</p>
            </div>
            <p className="text-xs text-slate-400 mt-1.5 capitalize">
              {formatTaskDate(task.created_at, language as 'en' | 'es')}
            </p>
          </div>

          {/* Due Date */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("due_date") || "Due"}
            </p>
            <p className="text-sm font-medium text-white capitalize">
              {formatTaskDate(task.due_date, language as 'en' | 'es')}
            </p>
          </div>

          {/* Task Type */}
          <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              {t("task_type") || "Type"}
            </p>
            <p className="text-sm font-medium text-white">
              {isOneTime ? (t("one_time_task") || "One-time Task") : (t("recurring_task") || "Recurring Task")}
            </p>
          </div>
        </div>

        {/* Template Information (if recurring) */}
        {!isOneTime && template?.title && template.title !== task.title && (
          <div className="mb-2 bg-brand-500/[0.05] border border-brand-500/10 rounded-2xl p-4 flex items-start gap-3">
            <div className="text-brand-400 mt-0.5">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-100 mb-1">
                {t("from_template") || "From Template"}
              </p>
              <p className="text-xs text-brand-200/70">
                {t("this_task_generated") || "This task was generated from:"} <strong className="text-brand-200">{template.title}</strong>
              </p>
            </div>
          </div>
        )}

      </div>
    </DraggableDrawer>
  );
}
