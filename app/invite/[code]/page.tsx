"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { usePreviewRoom, useJoinRoom } from "@/hooks/mutations/useTaskMutations";
import { useAtom } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useTranslation } from "@/hooks/useTranslation";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const previewRoom = usePreviewRoom();
  const joinRoom = useJoinRoom();
  const [, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const { t } = useTranslation();
  
  const [errorMsg, setErrorMsg] = useState("");
  const [roomInfo, setRoomInfo] = useState<any>(null);
  
  const code = typeof params?.code === "string" ? params.code : "";

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/login?next=/invite/${code}`);
      return;
    }
    if (!code) {
      setErrorMsg("Invalid invitation link.");
      return;
    }

    // Fetch room preview on mount
    const fetchPreview = async () => {
      try {
        const info = await previewRoom.mutateAsync(code);
        setRoomInfo(info);
      } catch (err: any) {
        setErrorMsg(err.message || "Invalid invitation link.");
      }
    };

    fetchPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, code]);

  const handleJoin = async () => {
    if (!user || !code) return;
    try {
      const room = await joinRoom.mutateAsync({ inviteCode: code, userId: user.id });
      setCurrentRoomId(room.id);
      router.push("/dashboard");
    } catch (err: any) {
      if (err.message?.includes("already a member")) {
        router.push("/dashboard");
      } else {
        setErrorMsg(err.message || "Failed to join room.");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-[0_0_40px_rgba(99,102,241,0.1)]">
        {errorMsg ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mb-6">
              <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Oops</h1>
            <p className="text-slate-400 text-sm mb-8">{errorMsg}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : !roomInfo ? (
          <div className="flex flex-col items-center animate-fade-in">
            <div className="w-12 h-12 border-4 border-brand-500/20 border-t-brand-500 rounded-full animate-spin mb-6" />
            <h1 className="text-xl font-bold text-white mb-2">Loading Room...</h1>
            <p className="text-slate-400 text-sm">Validating your invitation code</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            <h1 className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-6">You're invited to join</h1>
            
            <div className="bg-gradient-to-br from-brand-500/10 to-indigo-500/10 border border-brand-500/20 rounded-2xl p-6 text-center mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/10 rounded-full blur-3xl" />
              <h3 className="text-3xl font-black text-white tracking-tight mb-2 relative z-10">{roomInfo.name}</h3>
              <div className="flex flex-col items-center justify-center mt-4 relative z-10">
                <span className="text-[10px] uppercase tracking-widest text-brand-300 font-bold mb-1">{t("pool_contribution")}</span>
                <span className="text-4xl font-black text-white">${roomInfo.contribution_per_member}</span>
                <span className="text-xs text-brand-300/70 font-medium mt-1">
                  {roomInfo.period_duration_days === 1 
                    ? t("every_day") 
                    : t("every_x_days").replace("{days}", String(roomInfo.period_duration_days))}
                </span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 mb-8 text-left">
              <svg className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {t("agree_contribution")}
              </p>
            </div>

            <button
              onClick={handleJoin}
              disabled={joinRoom.isPending}
              className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50"
            >
              {joinRoom.isPending ? t("joining") : t("join_accept")}
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3 mt-3 text-slate-400 hover:text-white font-semibold transition-colors text-sm"
            >
              {t("cancel")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
