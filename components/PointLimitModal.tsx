"use client";

import { DraggableDrawer } from "./DraggableDrawer";
import { useUnclaimTask, useClaimTask, useCompleteTask } from "@/hooks/mutations/useTaskMutations";
import { useTranslation } from "@/hooks/useTranslation";
import { translations } from "@/lib/translations";

interface PointLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: "point_limit_exceeded" | "too_early" | "claim_limit_warning" | "claim_cooldown_active" | "claim_not_current_cycle";
  details?: any;
  taskId?: string;
  userId?: string;
  /** Indicates which RPC triggered the error, so the correct force-action is used. Defaults to 'complete'. */
  action?: "claim" | "complete";
}

export function PointLimitModal({
  isOpen,
  onClose,
  errorType,
  details,
  taskId,
  userId,
  action = "complete",
}: PointLimitModalProps) {
  const { t, language } = useTranslation();
  const unclaimTask = useUnclaimTask();
  const claimTask = useClaimTask();
  const completeTask = useCompleteTask();

  if (!isOpen) return null;

  const isPointLimit = errorType === "point_limit_exceeded";
  const isClaimWarning = errorType === "claim_limit_warning";
  const isCooldown = errorType === "claim_cooldown_active";
  const isFutureCycle = errorType === "claim_not_current_cycle";

  const handleGiveUp = async () => {
    if (taskId) {
      await unclaimTask.mutateAsync({ taskId });
    }
    onClose();
  };

  const handleClaimAnyway = async () => {
    if (taskId && userId) {
      await claimTask.mutateAsync({ taskId, userId, force: true });
    }
    onClose();
  };

  const handleCompleteAnyway = async () => {
    if (taskId && userId) {
      await completeTask.mutateAsync({ taskId, userId, force: true });
    }
    onClose();
  };

  return (
    <DraggableDrawer onClose={onClose}>
      <div className="text-center py-4">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${
          isClaimWarning ? "bg-brand-500/10 border-brand-500/20" : 
          isCooldown ? "bg-indigo-500/10 border-indigo-500/20" :
          "bg-amber-500/10 border-amber-500/20"
        }`}>
          <svg className={`w-10 h-10 ${isClaimWarning ? "text-brand-400" : isCooldown ? "text-indigo-400" : "text-amber-500"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            {isClaimWarning ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            ) : isCooldown ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : isFutureCycle ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            )}
          </svg>
        </div>

        <h2 className={`text-2xl font-black text-white mb-3`}>
          {isPointLimit ? t("limit_reached" as any) : isClaimWarning ? t("point_warning" as any) : isCooldown ? t("cooldown_active" as any) : isFutureCycle ? t("claim_not_current_cycle" as any) : t("too_early" as any)}
        </h2>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-[280px] mx-auto">
          {isPointLimit ? (
            <>
              {t("point_limit_desc")
                .replace("{partial}", details?.partial_points ?? "0")
                .replace("{period}", t(details?.period || "period"))
                .replace("{limit}", details?.limit || "0")}
              <br/><br/>
              {t("current_status")
                .replace("{earned}", details?.current || "0")
                .replace("{assigned}", "0")}
            </>
          ) : isClaimWarning ? (
            <>
              {t("claim_warning_desc")
                .replace("{pending}", details?.pending_reward || "0")
                .replace("{partial}", details?.partial_points ?? "0")
                .replace("{limit}", details?.limit || "0")
                .replace("{period}", t(details?.period || "")) }
              <br/><br/>
              {t("current_status")
                .replace("{earned}", details?.earned || "0")
                .replace("{assigned}", details?.assigned || "0")}
            </>
          ) : isCooldown ? (
            <>
              {t("cooldown_desc" as any)
                .replace("{days}", details?.remaining_days || "0")
                .replace("{hours}", details?.remaining_hours || "0")}
            </>
          ) : isFutureCycle ? (
            t("claim_not_current_cycle_desc" as any)
          ) : errorType === "too_early" ? (
            <>
              {t("too_early_desc").replace(
                "{date}",
                details?.due_date
                  ? new Intl.DateTimeFormat(translations[language].language_code, {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    }).format(new Date(details.due_date))
                  : ""
              )}
            </>
          ) : (
            details?.message || t("too_early_desc")
          )}
        </p>

        <div className="space-y-3">
          {isClaimWarning ? (
            <>
              <button
                onClick={handleClaimAnyway}
                disabled={claimTask.isPending}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20"
              >
                {claimTask.isPending ? t("claiming") : t("claim_anyway")}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold text-lg transition-all border border-white/10"
              >
                {t("cancel")}
              </button>
            </>
          ) : isPointLimit ? (
            <>
              {action === "claim" ? (
                <button
                  onClick={handleClaimAnyway}
                  disabled={claimTask.isPending}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20"
                >
                  {claimTask.isPending ? t("claiming") : t("claim_anyway")}
                </button>
              ) : (
                <button
                  onClick={handleCompleteAnyway}
                  disabled={completeTask.isPending}
                  className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20"
                >
                  {completeTask.isPending ? (t("completing") || "Completing...") : (t("complete_anyway") || "Complete Anyway")}
                </button>
              )}
              <button
                onClick={handleGiveUp}
                disabled={unclaimTask.isPending}
                className="w-full py-4 bg-white/5 hover:bg-red-500/10 text-red-400 rounded-2xl font-bold text-lg transition-all border border-white/10 hover:border-red-500/20"
              >
                {unclaimTask.isPending ? t("dropping") : t("give_up_task")}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold text-lg transition-all border border-white/10"
              >
                {t("cancel")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20"
              >
                {t("got_it")}
              </button>
            </>
          )}
        </div>

        {(isPointLimit || isClaimWarning) && (
          <p className="text-[10px] text-slate-500 mt-6 font-medium uppercase tracking-widest">
            {t("fair_play")}
          </p>
        )}
      </div>
    </DraggableDrawer>
  );
}
