"use client";

import { useAtom } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useAuth } from "@/hooks/useAuth";
import { useRooms, useRoom } from "@/hooks/queries/useRooms";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/useTranslation";
import Link from "next/link";
import { PushNotificationToggle } from "@/components/PushNotificationToggle";
import { LogoutConfirmModal } from "@/components/modals";
import { useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function SettingsPage() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const { data: rooms } = useRooms();
  const { data: currentRoom } = useRoom(currentRoomId);
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    router.push("/login");
  };

  const displayName = user?.user_metadata?.full_name || "User";
  const initials = displayName.charAt(0).toUpperCase();

  return (
    <div className="pb-10 pt-2">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t("back")}
        </button>
        <LanguageSwitcher />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-8">{t("settings")}</h1>

      {/* Profile Card → links to own profile */}
      <Link
        href={user?.id ? `/dashboard/profile/${user.id}` : "/dashboard/profile"}
        className="bg-white/[0.03] border border-white/[0.06] rounded-[28px] p-6 mb-8 flex items-center gap-5 hover:bg-white/[0.05] transition-colors group block"
      >
        {user?.user_metadata?.avatar_url ? (
          <img
            src={user.user_metadata.avatar_url}
            alt=""
            className="w-16 h-16 rounded-[20px] object-cover ring-4 ring-white/5 flex-shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-[20px] bg-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-xl ring-4 ring-white/5 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{displayName}</h2>
          <p className="text-sm text-slate-400 truncate">{user?.email}</p>
          <p className="text-xs text-brand-400 mt-1 font-medium group-hover:text-brand-300 transition-colors">
            {t("view_profile")} →
          </p>
        </div>
      </Link>

      {/* Notifications */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">{t("notifications")}</h3>
        <PushNotificationToggle />
      </div>

      {/* Household Selector */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">{t("your_households")}</h3>
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-[24px] overflow-hidden">
          {rooms && rooms.length > 0 ? (
            <div className="divide-y divide-white/5">
              {rooms.map((member) => (
                <button
                  key={member.room_id}
                  onClick={() => setCurrentRoomId(member.room_id)}
                  className={`w-full flex items-center justify-between p-5 text-left transition-colors ${
                    currentRoomId === member.room_id ? "bg-brand-500/10" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div>
                    <p className={`font-semibold ${currentRoomId === member.room_id ? "text-brand-400" : "text-white"}`}>
                      {member.rooms?.name}
                    </p>
                    {currentRoomId === member.room_id && (
                      <p className="text-xs text-brand-500/70 mt-0.5">{t("active_room")}</p>
                    )}
                  </div>
                  {currentRoomId === member.room_id && (
                    <div className="w-2.5 h-2.5 rounded-full bg-brand-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-sm">{t("not_in_any_rooms")}</div>
          )}
        </div>

        <div className="flex gap-3 mt-4">
          <Link
            href="/room/create"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-brand-600/20 hover:bg-brand-600/30 text-brand-400 rounded-xl font-semibold transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("create")}
          </Link>
          <Link
            href="/room/join"
            className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl font-semibold transition-colors border border-white/5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            {t("join")}
          </Link>
        </div>
      </div>

      {/* Active Room Details */}
      {currentRoom && (
        <div className="mb-8">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 ml-2">{t("active_room_details")}</h3>
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-[24px] p-5 space-y-4">
            <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl">
              <span className="text-slate-400 text-sm font-medium">{t("invite_code")}</span>
              <span className="text-white font-mono font-bold tracking-widest">{currentRoom.invite_code}</span>
            </div>
          </div>
        </div>
      )}

      {/* Sign Out */}
      <button
        onClick={() => setShowLogoutModal(true)}
        className="w-full flex items-center justify-center gap-2 py-4 bg-danger/10 hover:bg-danger/20 text-danger rounded-2xl font-bold transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
        {t("log_out")}
      </button>

      <LogoutConfirmModal
        isOpen={showLogoutModal}
        isPending={isLoggingOut}
        onConfirm={handleSignOut}
        onClose={() => setShowLogoutModal(false)}
      />
    </div>
  );
}
