"use client";

import { useTranslation } from "@/hooks/useTranslation";

interface GenericErrorModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
}

export function GenericErrorModal({ isOpen, message, onClose }: GenericErrorModalProps) {
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>

        {/* Text */}
        <h2 className="text-xl font-black text-white text-center mb-2">{t("error_title")}</h2>
        <p className="text-slate-400 text-sm text-center leading-relaxed mb-6">{message}</p>

        {/* Action */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold text-base transition-colors shadow-lg shadow-brand-500/20"
        >
          {t("got_it")}
        </button>
      </div>
    </div>
  );
}
