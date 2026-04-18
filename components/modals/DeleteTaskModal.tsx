"use client";

import { useTranslation } from "@/hooks/useTranslation";

interface DeleteTaskModalProps {
  isOpen: boolean;
  taskTitle: string;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
  /** Optional: override the modal title (defaults to t('delete_task_title')) */
  overrideTitle?: string;
  /** Optional: override the body text (defaults to t('delete_task_desc') with title interpolated) */
  overrideDescription?: string;
  /** Optional: override the confirm button label (defaults to t('delete_task_confirm')) */
  overrideConfirmLabel?: string;
}

export function DeleteTaskModal({ isOpen, taskTitle, isPending, onConfirm, onClose, overrideTitle, overrideDescription, overrideConfirmLabel }: DeleteTaskModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-xl font-black text-white text-center mb-2">
          {overrideTitle ?? t("delete_task_title")}
        </h2>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">
          {overrideDescription ?? t("delete_task_desc").replace("{title}", taskTitle)}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="w-full py-3.5 bg-red-500/90 hover:bg-red-500 active:bg-red-600 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
          >
            {isPending ? t("deleting") : (overrideConfirmLabel ?? t("delete_task_confirm"))}
          </button>
          <button
            onClick={onClose}
            disabled={isPending}
            className="w-full py-3.5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-bold text-base transition-all border border-white/10"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
