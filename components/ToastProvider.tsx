"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { toastsAtom, removeToastAtom } from "@/store/toastAtom";

export function ToastProvider() {
  const toasts = useAtomValue(toastsAtom);
  const removeToast = useSetAtom(removeToastAtom);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none w-full max-w-md px-4 items-center">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border pointer-events-auto animate-fade-in w-max max-w-full ${
            toast.type === "success"
              ? "bg-emerald-900/95 border-emerald-500/30 text-emerald-100 shadow-emerald-900/20"
              : toast.type === "error"
              ? "bg-red-900/95 border-red-500/30 text-red-100 shadow-red-900/20"
              : "bg-slate-800/95 border-white/10 text-slate-200 shadow-slate-900/40"
          }`}
        >
          {toast.type === "success" && (
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
          )}
          {toast.type === "info" && (
            <div className="w-6 h-6 rounded-full bg-slate-500/20 flex items-center justify-center flex-shrink-0 text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
          )}
          {toast.type === "error" && (
             <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0 text-red-400">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
               </svg>
             </div>
          )}
          <span className="text-sm font-semibold truncate">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors opacity-70 hover:opacity-100 flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
