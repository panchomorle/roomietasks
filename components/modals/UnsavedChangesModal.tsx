"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { useState } from "react";

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSave: () => Promise<void> | void;
}

export function UnsavedChangesModal({ isOpen, onClose, onDiscard, onSave }: UnsavedChangesModalProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-slate-900 border border-white/10 rounded-[32px] p-6 w-full max-w-sm shadow-2xl animate-fade-in text-center">
        
        {/* Close "X" button */}
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4 border bg-amber-500/10 border-amber-500/20 text-amber-500">
           <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
           </svg>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">{t("unsaved_changes_title" as any) || "Unsaved Changes"}</h3>
        <p className="text-sm text-slate-400 mb-6">{t("unsaved_changes_desc" as any) || "You have unsaved changes. Do you want to save them before closing?"}</p>
        
        <div className="flex flex-col gap-3">
          <button onClick={handleSave} disabled={isSaving} className="w-full py-3 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-xl font-bold transition-colors">
            {isSaving ? t("saving" as any) : t("save_changes" as any)}
          </button>
          <button onClick={onDiscard} disabled={isSaving} className="w-full py-3 bg-white/5 hover:bg-red-500/10 active:bg-red-500/20 text-red-400 border border-white/10 hover:border-red-500/20 rounded-xl font-bold transition-colors">
            {t("discard_changes" as any) || "Discard"}
          </button>
        </div>
      </div>
    </div>
  );
}
