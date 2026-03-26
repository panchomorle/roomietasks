"use client";

import { useTranslation } from "@/hooks/useTranslation";
import { usePushNotifications } from "@/hooks/usePushNotifications";

export function PushNotificationToggle() {
  const { t } = useTranslation();
  const { permission, isSubscribed, isLoading, subscribe, unsubscribe } =
    usePushNotifications();

  const isIOS =
    typeof navigator !== "undefined" &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !(window as Window & { MSStream?: unknown }).MSStream;

  // Unsupported browser
  if (permission === "unsupported") {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-5">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
            <BellIcon className="w-5 h-5 text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-white">{t("push_notifications")}</h3>
          <span className="ml-auto text-[11px] font-medium px-2.5 py-1 rounded-full bg-slate-800 text-slate-400">
            {t("push_unsupported")}
          </span>
        </div>
      </div>
    );
  }

  const statusLabel =
    permission === "denied"
      ? t("push_blocked")
      : isSubscribed
      ? t("push_enabled")
      : t("push_disabled");

  const statusColor =
    permission === "denied"
      ? "bg-red-500/10 text-red-400"
      : isSubscribed
      ? "bg-emerald-500/10 text-emerald-400"
      : "bg-slate-800 text-slate-400";

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
            isSubscribed
              ? "bg-brand-600/20"
              : "bg-slate-800"
          }`}
        >
          <BellIcon
            className={`w-5 h-5 transition-colors ${
              isSubscribed ? "text-brand-400" : "text-slate-400"
            }`}
          />
        </div>
        <h3 className="text-sm font-semibold text-white">
          {t("push_notifications")}
        </h3>
        <span
          className={`ml-auto text-[11px] font-semibold px-2.5 py-1 rounded-full ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-slate-400 leading-relaxed">
        {t("push_notifications_desc")}
      </p>

      {/* iOS note */}
      {isIOS && (
        <div className="flex gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <svg
            className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
          <p className="text-xs text-amber-300 leading-relaxed">
            {t("push_ios_note")}
          </p>
        </div>
      )}

      {/* Action button */}
      {permission !== "denied" && (
        <button
          onClick={isSubscribed ? unsubscribe : subscribe}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200 ${
            isSubscribed
              ? "bg-danger/10 hover:bg-danger/20 text-danger"
              : "bg-brand-600/20 hover:bg-brand-600/30 text-brand-400"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading
            ? isSubscribed
              ? t("push_disabling")
              : t("push_enabling")
            : isSubscribed
            ? t("push_disable")
            : t("push_enable")}
        </button>
      )}

      {/* Blocked state: direct user to browser settings */}
      {permission === "denied" && (
        <p className="text-xs text-red-400/80 text-center">
          To enable, allow notifications for this site in your browser settings.
        </p>
      )}
    </div>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}
