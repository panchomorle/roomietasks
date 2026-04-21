"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAtom } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useRooms } from "@/hooks/queries/useRooms";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { SeasonManager } from "@/components/SeasonManager";
import { NotificationPromptModal, LogoutConfirmModal } from "@/components/modals";
import { useTranslation } from "@/hooks/useTranslation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, loading: authLoading, signOut } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Sync timezone to DB once per session so Edge Functions can use it
  useEffect(() => {
    if (!user?.id) return;
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    supabase
      .from("profiles")
      .update({ timezone: tz })
      .eq("id", user.id)
      .then(() => { /* fire-and-forget */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close avatar menu on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setAvatarMenuOpen(false);
      }
    }
    if (avatarMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [avatarMenuOpen]);

  const hasRooms = rooms && rooms.length > 0;

  // Auto-select first room if none selected, or if the persisted room is no longer valid
  useEffect(() => {
    if (mounted && !roomsLoading && hasRooms) {
      const isValidRoom = rooms.some((r: any) => r.room_id === currentRoomId);
      if (!currentRoomId || !isValidRoom) {
        setCurrentRoomId(rooms[0].room_id);
      }
    }
  }, [mounted, currentRoomId, hasRooms, rooms, roomsLoading, setCurrentRoomId]);

  // If no room is active and user is not on an allowed route, redirect to rooms
  const allowedWithoutRoom = ["/dashboard/rooms", "/dashboard/profile", "/dashboard/settings"];
  const isAllowedRoute = allowedWithoutRoom.some(
    (route) => pathname === route || pathname.startsWith("/dashboard/profile/")
  );

  useEffect(() => {
    if (!authLoading && !roomsLoading && !hasRooms && !isAllowedRoute) {
      router.replace("/dashboard/rooms");
    }
  }, [authLoading, roomsLoading, hasRooms, isAllowedRoute, pathname, router]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    router.push("/login");
  };

  const featureTabs = [
    {
      label: t("tasks"),
      href: "/dashboard",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
        </svg>
      ),
    },
    {
      label: t("board"),
      href: "/dashboard/leaderboard",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 6.75h13.5" />
        </svg>
      ),
    },
    {
      label: t("history"),
      href: "/dashboard/history",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      label: t("rooms"),
      href: "/dashboard/rooms",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
        </svg>
      ),
    },
    {
      label: t("profile"),
      href: "/dashboard/profile",
      icon: (
        <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
    },
  ];

  // Only show feature tabs (Tasks/Board/History) when a room is active
  const navItems = hasRooms && currentRoomId
    ? featureTabs
    : featureTabs.filter((tab) => tab.href === "/dashboard/rooms" || tab.href === "/dashboard/profile");

  const avatarUrl = user?.user_metadata?.avatar_url;
  const displayName = user?.user_metadata?.full_name || user?.email || "?";
  const initials = displayName.charAt(0).toUpperCase();

  // Determine if profile tab is active (profile page or profile/[userId] subpages)
  const isProfileActive = pathname === "/dashboard/profile" || pathname.startsWith("/dashboard/profile/");

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col md:flex-row bg-slate-950">
      <SeasonManager />
      <NotificationPromptModal />

      {/* Logout Confirmation Modal */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        isPending={isLoggingOut}
        onConfirm={handleSignOut}
        onClose={() => setShowLogoutModal(false)}
      />

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex flex-col w-72 border-r border-white/5 bg-slate-950/50 backdrop-blur-xl">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0">
            <img src="/icons/roomietasks.svg" alt="RoomieTasks Logo" className="w-full h-full" style={{ filter: "drop-shadow(0 0 10px rgba(139,92,246,0.4)) drop-shadow(0 0 20px rgba(99,102,241,0.2))" }} />
          </div>
          <span className="text-lg font-bold text-white">RoomieTasks</span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard/profile"
              ? isProfileActive
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-brand-600/20 text-brand-400 shadow-sm"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <div className="w-5 h-5">{item.icon}</div>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Avatar Menu at sidebar bottom */}
        <div className="p-4 border-t border-white/5" ref={avatarMenuRef}>
          <button
            onClick={() => setAvatarMenuOpen((v) => !v)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all group"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-sm ring-2 ring-brand-500/20 flex-shrink-0">
                {initials}
              </div>
            )}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold text-white truncate">{displayName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
            <svg className={`w-4 h-4 text-slate-500 transition-transform flex-shrink-0 ${avatarMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </button>

          {/* Dropdown */}
          {avatarMenuOpen && (
            <div className="mt-2 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-xl animate-fade-in">
              <Link
                href={user?.id ? `/dashboard/profile/${user.id}` : "/dashboard/profile"}
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {t("my_profile")}
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setAvatarMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {t("my_settings")}
              </Link>
              <div className="h-px bg-white/5 mx-3" />
              <button
                onMouseDown={(e) => { 
                  e.preventDefault();
                  e.stopPropagation();
                  setAvatarMenuOpen(false); 
                  setShowLogoutModal(true); 
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                {t("log_out")}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
        {/* Mobile Header with Avatar */}
        <header className="md:hidden flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 flex-shrink-0">
              <img src="/icons/roomietasks.svg" alt="RoomieTasks" className="w-full h-full" style={{ filter: "drop-shadow(0 0 8px rgba(139,92,246,0.4))" }} />
            </div>
            <span className="text-sm font-bold text-white">RoomieTasks</span>
          </div>

          {/* Mobile Avatar Trigger */}
          <div className="relative" ref={avatarMenuOpen ? avatarMenuRef : undefined}>
            <button
              onClick={() => setAvatarMenuOpen((v) => !v)}
              className="flex-shrink-0 transition-transform active:scale-95"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-brand-500/40" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-sm ring-2 ring-brand-500/20">
                  {initials}
                </div>
              )}
            </button>

            {/* Mobile Dropdown */}
            {avatarMenuOpen && (
              <div
                ref={avatarMenuRef}
                className="absolute right-0 top-12 w-52 bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-50 animate-fade-in"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <p className="text-sm font-semibold text-white truncate">{displayName}</p>
                  <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                </div>
                <Link
                  href={user?.id ? `/dashboard/profile/${user.id}` : "/dashboard/profile"}
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                  {t("my_profile")}
                </Link>
                <Link
                  href="/dashboard/settings"
                  onClick={() => setAvatarMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {t("my_settings")}
                </Link>
                <div className="h-px bg-white/5 mx-3" />
                <button
                  onMouseDown={(e) => { 
                    e.preventDefault();
                    e.stopPropagation();
                    setAvatarMenuOpen(false); 
                    setShowLogoutModal(true); 
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-danger hover:bg-danger/10 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                  {t("log_out")}
                </button>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 z-50 px-2 pb-safe pt-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = item.href === "/dashboard/profile"
              ? isProfileActive
              : pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full py-2 px-1 transition-colors ${
                  isActive ? "text-brand-400" : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div className={`w-6 h-6 mb-1 ${isActive ? "scale-110 transition-transform" : ""}`}>
                  {item.icon}
                </div>
                <span className="text-[10px] font-medium tracking-wide">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
