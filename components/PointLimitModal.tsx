"use client";

import { DraggableDrawer } from "./DraggableDrawer";
import { useUnclaimTask, useClaimTask } from "@/hooks/mutations/useTaskMutations";

interface PointLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorType: "point_limit_exceeded" | "too_early" | "claim_limit_warning";
  details?: any;
  taskId?: string;
  userId?: string;
}

export function PointLimitModal({
  isOpen,
  onClose,
  errorType,
  details,
  taskId,
  userId,
}: PointLimitModalProps) {
  const unclaimTask = useUnclaimTask();
  const claimTask = useClaimTask();

  if (!isOpen) return null;

  const isPointLimit = errorType === "point_limit_exceeded";
  const isClaimWarning = errorType === "claim_limit_warning";

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

  return (
    <DraggableDrawer onClose={onClose}>
      <div className="text-center py-4">
        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 border ${
          isClaimWarning ? "bg-brand-500/10 border-brand-500/20" : "bg-amber-500/10 border-amber-500/20"
        }`}>
          <svg className={`w-10 h-10 ${isClaimWarning ? "text-brand-400" : "text-amber-500"}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            {isClaimWarning ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            )}
          </svg>
        </div>

        <h2 className={`text-2xl font-black text-white mb-3`}>
          {isPointLimit ? "Limit Reached!" : isClaimWarning ? "Point Warning" : "Way Too Early!"}
        </h2>
        
        <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-[280px] mx-auto">
          {isPointLimit ? (
            <>
              You've already earned <span className="text-white font-bold">{details?.current || 0}</span> points this {details?.period || 'period'}. 
              Completing this would exceed your <span className="text-brand-400 font-bold">{details?.limit}pt</span> limit.
            </>
          ) : isClaimWarning ? (
            <>
              Claiming this task (<span className="text-white font-bold">{details?.pending_reward}pt</span>) might push you over your <span className="text-brand-400 font-bold">{details?.limit}pt</span> {details?.period}ly limit.
              <br/><br/>
              Current status: <span className="text-white">{details?.earned || 0}</span> earned + <span className="text-white">{details?.assigned || 0}</span> already claimed.
            </>
          ) : (
            details?.message || "You completed this task too recently. Give others a chance or wait until it's closer to the due date!"
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
                {claimTask.isPending ? "Claiming..." : "Claim anyway"}
              </button>
              <button
                onClick={onClose}
                className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold text-lg transition-all border border-white/10"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              {isPointLimit && (
                <button
                  onClick={handleGiveUp}
                  disabled={unclaimTask.isPending}
                  className="w-full py-4 bg-white/5 hover:bg-red-500/10 text-red-400 rounded-2xl font-bold text-lg transition-all border border-white/10 hover:border-red-500/20"
                >
                  {unclaimTask.isPending ? "Dropping..." : "Give up task"}
                </button>
              )}
              
              <button
                onClick={onClose}
                className="w-full py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20"
              >
                Got it
              </button>
            </>
          )}
        </div>

        {(isPointLimit || isClaimWarning) && (
          <p className="text-[10px] text-slate-500 mt-6 font-medium uppercase tracking-widest">
            Fair play keeps the room happy
          </p>
        )}
      </div>
    </DraggableDrawer>
  );
}
