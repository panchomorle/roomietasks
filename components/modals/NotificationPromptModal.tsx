"use client";

import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { pushPromptDismissedAtom } from "@/store/atoms";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useTranslation } from "@/hooks/useTranslation";

export function NotificationPromptModal() {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useAtom(pushPromptDismissedAtom);
  const { permission, isSubscribed, subscribe, isLoading } =
    usePushNotifications();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Show prompt after a short delay if conditions are met
  useEffect(() => {
    // Don't show if: already dismissed, already subscribed, not supported, or blocked
    if (
      dismissed ||
      isSubscribed ||
      permission === "unsupported" ||
      permission === "denied"
    ) {
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
      // Trigger entrance animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    }, 2000); // 2 second delay for non-intrusive UX

    return () => clearTimeout(timer);
  }, [dismissed, isSubscribed, permission]);

  const handleDismiss = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      setDismissed(true);
    }, 300);
  }, [setDismissed]);

  const handleEnable = useCallback(async () => {
    await subscribe();
    setAnimateIn(false);
    setTimeout(() => {
      setVisible(false);
      setDismissed(true);
    }, 300);
  }, [subscribe, setDismissed]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end sm:items-center justify-center transition-all duration-300 ${
        animateIn ? "bg-black/60 backdrop-blur-sm" : "bg-black/0"
      }`}
      onClick={handleDismiss}
    >
      <div
        className={`w-full max-w-sm mx-4 mb-4 sm:mb-0 transition-all duration-300 ease-out ${
          animateIn
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-slate-900/95 border border-white/10 rounded-3xl p-6 shadow-2xl shadow-black/50 backdrop-blur-xl">
          {/* Bell icon with animated ring */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/20 to-violet-500/20 border border-brand-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-brand-400 animate-bell"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </div>
              {/* Animated pulse ring */}
              <div className="absolute inset-0 rounded-2xl bg-brand-500/10 animate-ping-slow" />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-xl font-bold text-white text-center mb-2">
            {t("push_prompt_title")}
          </h3>
          <p className="text-sm text-slate-400 text-center leading-relaxed mb-6">
            {t("push_prompt_desc")}
          </p>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleEnable}
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-brand-600 to-violet-600 hover:from-brand-500 hover:to-violet-500 text-white rounded-2xl font-bold text-sm transition-all duration-200 shadow-lg shadow-brand-500/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {isLoading ? t("push_enabling") : t("push_prompt_enable")}
            </button>
            <button
              onClick={handleDismiss}
              className="w-full py-3 text-slate-500 hover:text-slate-300 text-sm font-medium transition-colors"
            >
              {t("push_prompt_dismiss")}
            </button>
          </div>
        </div>
      </div>

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes bell-ring {
          0%, 100% { transform: rotate(0deg); }
          10% { transform: rotate(14deg); }
          20% { transform: rotate(-12deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-8deg); }
          50% { transform: rotate(0deg); }
        }
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.3; }
          75%, 100% { transform: scale(1.4); opacity: 0; }
        }
        :global(.animate-bell) {
          animation: bell-ring 2s ease-in-out 0.5s;
        }
        :global(.animate-ping-slow) {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </div>
  );
}
