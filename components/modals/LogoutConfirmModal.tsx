"use client";

import { useTranslation } from "@/hooks/useTranslation";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  isPending: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function LogoutConfirmModal({ isOpen, isPending, onConfirm, onClose }: LogoutConfirmModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-xl font-black text-white text-center mb-2">
          {t("log_out_confirm")}
        </h2>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">
          {t("log_out_confirm_desc")}
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="w-full py-3.5 bg-danger/90 hover:bg-danger active:bg-danger/80 text-white rounded-2xl font-bold text-base transition-all shadow-lg shadow-danger/20 disabled:opacity-50"
          >
            {t("log_out_confirm_btn")}
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
