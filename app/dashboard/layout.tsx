"use client";

import { useAuth } from "@/hooks/useAuth";
import { useAtom } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useRooms } from "@/hooks/queries/useRooms";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { SeasonManager } from "@/components/SeasonManager";
import { NotificationPromptModal } from "@/components/NotificationPromptModal";
import { useTranslation } from "@/hooks/useTranslation";
import { createClient } from "@/lib/supabase/client";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { user, loading: authLoading } = useAuth();
  const [currentRoomId, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const { data: rooms, isLoading: roomsLoading } = useRooms();
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
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

  const hasRooms = rooms && rooms.length > 0;

  // Auto-select first room if none selected, or if the persisted room is no longer valid
  // We wait for `mounted` so we don't accidentally overwrite Jotai atomWithStorage before hydration completes.
  useEffect(() => {
    if (mounted && !roomsLoading && hasRooms) {
      const isValidRoom = rooms.some((r: any) => r.room_id === currentRoomId);
      if (!currentRoomId || !isValidRoom) {
        setCurrentRoomId(rooms[0].room_id);
      }
    }
  }, [mounted, currentRoomId, hasRooms, rooms, roomsLoading, setCurrentRoomId]);

  // If no room is active and user is not on /dashboard/rooms, redirect there
  useEffect(() => {
    if (!authLoading && !roomsLoading && !hasRooms && pathname !== "/dashboard/rooms") {
      router.replace("/dashboard/rooms");
    }
  }, [authLoading, roomsLoading, hasRooms, pathname, router]);

  const roomsTab = {
    label: t("rooms"),
    href: "/dashboard/rooms",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
  };

  const profileTab = {
    label: t("profile"),
    href: "/dashboard/profile",
    icon: (
      <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
      </svg>
    ),
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
  ];

  // Only show feature tabs when a room is active; profile is always shown
  const navItems = hasRooms && currentRoomId
    ? [...featureTabs, roomsTab, profileTab]
    : [roomsTab, profileTab];

  // Show a brief loading skeleton only during initial auth hydration
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
            const isActive = pathname === item.href;
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
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[100dvh] overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          <div className="max-w-4xl mx-auto w-full p-4 md:p-8">
            {children}
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation (hidden on desktop) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 z-50 px-2 pb-safe pt-1">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
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
