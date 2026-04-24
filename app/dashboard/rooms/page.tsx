"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRooms, useRoom } from "@/hooks/queries/useRooms";
import { useCreateRoom, useJoinRoom, useLeaveRoom, useUpdateRoom, usePreviewRoom } from "@/hooks/mutations/useTaskMutations";
import { useAtom } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DraggableDrawer } from "@/components/DraggableDrawer";
import { RoomSettingsDrawer } from "@/components/RoomSettingsDrawer";
import { useTranslation } from "@/hooks/useTranslation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { formatPoints } from "@/lib/numberUtils";
import { getUserTimezone } from "@/lib/timezoneUtils";

// ─── Create Room Drawer ──────────────────────────────────────
function CreateRoomDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t, language } = useTranslation();
  const createRoom = useCreateRoom();
  const [, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const initialForm = {
    name: "",
    contribution: 50,
    periodDays: 30,
    pointLimit: "0",
    pointLimitPeriod: "week" as "day" | "week" | "month",
  };
  const [form, setForm] = useState(initialForm);
  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const room = await createRoom.mutateAsync({
      name: form.name,
      contributionPerMember: form.contribution,
      periodDurationDays: form.periodDays,
      userId,
      pointLimit: (parseFloat(form.pointLimit as string) || 0) > 0 ? parseFloat(form.pointLimit as string) : undefined,
      pointLimitPeriod: (parseFloat(form.pointLimit as string) || 0) > 0 ? form.pointLimitPeriod : undefined,
      timezone: getUserTimezone(),
    });
    setCurrentRoomId(room.id);
    onClose();
  };

  return (
    <DraggableDrawer onClose={onClose} isDirty={isDirty} onSave={handleSubmit}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">{t("create_a_room")}</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("household_name")}</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
            placeholder={t("room_name_placeholder")}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("contribution_label")}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              required
              value={form.contribution}
              onChange={(e) => setForm({ ...form, contribution: parseFloat(e.target.value) })}
              className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
            />
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">{t("period_days_label")}</label>
            <input
              type="number"
              min={1}
              required
              value={form.periodDays}
              onChange={(e) => setForm({ ...form, periodDays: parseInt(e.target.value) })}
              className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("point_limit")}</label>
            <div className="flex bg-white/5 rounded-lg p-0.5">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setForm({ ...form, pointLimitPeriod: p })}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    form.pointLimitPeriod === p
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {t(p)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
                type="number"
                min={0}
                max={9999}
                value={form.pointLimit}
                onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                onChange={(e) => {
                  let val = e.target.value;
                  if (val && !/^\d*\.?\d{0,2}$/.test(val)) {
                    const parts = val.split('.');
                    val = parts[0] + '.' + parts[1].slice(0, 2);
                  }
                  if (parseFloat(val) > 9999) val = "9999";
                  setForm({ ...form, pointLimit: val });
                }}
              className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
              placeholder={t("no_limit")}
            />
            <span className="text-sm font-medium text-slate-500">{t("pts")}/{t(form.pointLimitPeriod)}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            {t("limit_description").replace("{period}", t(form.pointLimitPeriod))}
          </p>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={createRoom.isPending}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {createRoom.isPending ? t("creating") : t("create")}
          </button>
        </div>
        {createRoom.isError && (
          <p className="text-red-400 text-sm text-center">{(createRoom.error as Error).message}</p>
        )}
      </form>
    </DraggableDrawer>
  );
}

// ─── Join Room Drawer ────────────────────────────────────────
function JoinRoomDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const { t, language } = useTranslation();
  const previewRoom = usePreviewRoom();
  const joinRoom = useJoinRoom();
  const [, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const [code, setCode] = useState("");
  const [roomInfo, setRoomInfo] = useState<any>(null);

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const info = await previewRoom.mutateAsync(code);
      setRoomInfo(info);
    } catch (err) {
      // The mutation hook handles throwing the error, react-query makes it available via previewRoom.error
    }
  };

  const handleConfirmJoin = async () => {
    try {
      const room = await joinRoom.mutateAsync({ inviteCode: code, userId });
      setCurrentRoomId(room.id);
      onClose();
    } catch (err) {
      // Handled by joinRoom.error
    }
  };

  return (
    <DraggableDrawer onClose={onClose}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">{t("join_room")}</h2>
      
      {!roomInfo ? (
        <>
          <p className="text-slate-400 text-sm mb-6">{t("invite_code_prompt")}</p>
          <form onSubmit={handlePreview} className="space-y-4">
            <input
              type="text"
              required
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-white text-2xl text-center tracking-[0.4em] font-mono font-bold placeholder:text-slate-600 placeholder:tracking-[0.2em] placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              placeholder={t("invite_code_placeholder")}
            />
            <button
              type="submit"
              disabled={previewRoom.isPending || code.length < 4}
              className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {previewRoom.isPending ? t("searching") : t("preview_room")}
            </button>
            {previewRoom.isError && (
              <p className="text-red-400 text-sm text-center">{(previewRoom.error as Error).message}</p>
            )}
          </form>
        </>
      ) : (
        <div className="space-y-6 animate-fade-in mt-4">
          <div className="bg-gradient-to-br from-brand-500/10 to-indigo-500/10 border border-brand-500/20 rounded-2xl p-6 text-center">
            <h3 className="text-2xl font-black text-white mb-2">{roomInfo.name}</h3>
            <div className="flex flex-col items-center justify-center gap-1 mt-4">
              <span className="text-xs uppercase tracking-widest text-brand-300 font-semibold">{t("pool_contribution")}</span>
              <span className="text-3xl font-bold text-white">${roomInfo.contribution_per_member}</span>
              <span className="text-xs text-slate-400">
                {roomInfo.period_duration_days === 1 ? t("every_day") : t("every_x_days").replace("{days}", String(roomInfo.period_duration_days))}
              </span>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-slate-300">
              {t("agree_contribution")}
            </p>
          </div>

          <div className="flex gap-3">
             <button
              onClick={() => {
                setRoomInfo(null);
                setCode("");
              }}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleConfirmJoin}
              disabled={joinRoom.isPending}
              className="flex-[2] py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {joinRoom.isPending ? t("searching") : t("join_accept")}
            </button>
          </div>
          {joinRoom.isError && (
             <p className="text-red-400 text-sm text-center">{(joinRoom.error as Error).message}</p>
          )}
        </div>
      )}
    </DraggableDrawer>
  );
}


// ─── Room Card ───────────────────────────────────────────────
function RoomCard({
  membership,
  isActive,
  onSelect,
  onLeave,
  onOpenSettings,
  leavePending,
}: {
  membership: any;
  isActive: boolean;
  onSelect: () => void;
  onLeave: () => void;
  onOpenSettings: () => void;
  leavePending: boolean;
}) {
  const { t, language } = useTranslation();
  const room = membership.rooms;
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteUrl = room?.invite_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${room.invite_code}`
    : "";

  const handleShare = async () => {
    const shareData = {
      title: t("share_title").replace("{room}", room?.name || ""), 
      text: t("share_text").replace("{room}", room?.name || ""), 
      url: inviteUrl,
    };

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`group bg-white/[0.03] border rounded-[24px] p-5 transition-all ${
      isActive ? "border-brand-500/40 shadow-[0_0_20px_rgba(99,102,241,0.08)]" : "border-white/[0.06]"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
              {room?.name}
            </h3>
            {isActive && (
              <span className="flex-shrink-0 px-2 py-0.5 bg-brand-500/20 text-brand-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                {t("active")}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {membership.role === "admin" ? t("admin") : t("member")} · ${room?.contribution_per_member}{t("per_period")} · {room?.period_duration_days} {room?.period_duration_days === 1 ? t("day") : t("days")}
          </p>
          {room?.point_limit ? (
            <p className="text-[10px] text-brand-400/80 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
              </svg>
              {t("point_limit")}: {formatPoints(room.point_limit, language as 'en' | 'es')} {t("pts")}/{t(room.point_limit_period)}
            </p>
          ) : (
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-1.5">{t("no_limit")}</p>
          )}
          {room?.recurrent_cooldown_days > 0 && (
            <p className="text-[10px] text-indigo-400/80 font-bold uppercase tracking-wider mt-1 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t("cooldown")}: {room.recurrent_cooldown_days} {room.recurrent_cooldown_days === 1 ? t("day") : t("days")}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-500/15 hover:bg-brand-500/25 active:bg-brand-500/35 text-brand-400 rounded-xl transition-colors text-xs font-semibold"
            title="Share invite link"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            {copied ? t("copied") : t("share")}
          </button>

          {membership.role === "admin" && (
            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-brand-400 transition-colors bg-white/5 rounded-xl border border-white/5"
              title="Room Settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Invite Code Toggle + small copy icon */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex-1 flex items-center justify-between bg-white/5 hover:bg-white/[0.07] active:bg-white/10 rounded-xl px-4 py-3 transition-colors"
          >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("invite_code")}</span>
            {showInvite ? (
              <span className="text-white font-mono font-bold tracking-[0.3em] text-sm">{room?.invite_code}</span>
            ) : (
              <span className="text-slate-500 text-xs font-medium">{t("tap_to_reveal")}</span>
            )}
          </button>

          {showInvite && room?.invite_code && (
            <button
              onClick={handleCopyLink}
              className="flex-shrink-0 p-3 bg-white/5 hover:bg-white/[0.07] active:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-brand-400"
              title="Copy invite link"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!isActive ? (
          <button
            onClick={onSelect}
            className="flex-1 py-3 bg-brand-600/20 hover:bg-brand-600/30 active:bg-brand-600/40 text-brand-400 rounded-xl font-semibold text-sm transition-colors"
          >
            {t("switch_to_room")}
          </button>
        ) : (
          <div className="flex-1 py-3 bg-brand-500/10 text-brand-400/60 rounded-xl font-semibold text-sm text-center cursor-default">
            {t("currently_active")}
          </div>
        )}
        <button
          onClick={() => {
            if (confirm(t("leave_room_confirm").replace("{room}", room?.name || ""))) {
              onLeave();
            }
          }}
          disabled={leavePending}
          className="px-4 py-3 bg-danger/10 hover:bg-danger/20 active:bg-danger/30 text-danger rounded-xl font-semibold text-sm transition-colors flex-shrink-0"
        >
          {leavePending ? t("leaving") : t("leave")}
        </button>
      </div>
    </div>
  );
}

// ─── Main Rooms Page ─────────────────────────────────────────
export default function RoomsPage() {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const { data: rooms, isLoading } = useRooms();
  const [currentRoomId, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const leaveRoom = useLeaveRoom();
  const router = useRouter();

  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showJoinDrawer, setShowJoinDrawer] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);

  const handleLeave = (roomId: string) => {
    leaveRoom.mutate(
      { roomId, userId: user?.id ?? "" },
      {
        onSuccess: () => {
          if (currentRoomId === roomId) {
            setCurrentRoomId(null);
          }
        },
      }
    );
  };

  return (
    <div className="pb-10 pt-2">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{t("your_rooms")}</h1>
          <p className="text-sm text-slate-500 mt-1">{t("manage_households")}</p>
        </div>
        <LanguageSwitcher />
      </div>

      {/* Big Action Cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <button
          onClick={() => setShowCreateDrawer(true)}
          className="group relative bg-gradient-to-br from-brand-600/20 to-violet-600/20 border border-brand-500/20 hover:border-brand-500/40 active:border-brand-500/50 rounded-[24px] p-6 text-left transition-all overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-brand-500/10 rounded-full blur-2xl group-hover:bg-brand-500/20 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-brand-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-brand-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-base mb-1">{t("create")}</h3>
          <p className="text-slate-500 text-xs leading-relaxed">{t("start_new_household")}</p>
        </button>

        <button
          onClick={() => setShowJoinDrawer(true)}
          className="group relative bg-gradient-to-br from-emerald-600/15 to-teal-600/15 border border-emerald-500/20 hover:border-emerald-500/40 active:border-emerald-500/50 rounded-[24px] p-6 text-left transition-all overflow-hidden"
        >
          <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-colors" />
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM3 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 019.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
          </div>
          <h3 className="text-white font-bold text-base mb-1">{t("join")}</h3>
          <p className="text-slate-500 text-xs leading-relaxed">{t("use_invite_code")}</p>
        </button>
      </div>

      {/* Room List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-white/[0.03] border border-white/[0.06] rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : rooms && rooms.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">{t("your_households")}</h3>
          {rooms.map((membership) => (
            <RoomCard
              key={membership.room_id}
              membership={membership}
              isActive={currentRoomId === membership.room_id}
              onSelect={() => setCurrentRoomId(membership.room_id)}
              onLeave={() => handleLeave(membership.room_id)}
              onOpenSettings={() => setEditingRoom(membership.rooms)}
              leavePending={leaveRoom.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-[28px]">
          <div className="w-20 h-20 mx-auto mb-5">
            <img src="/icons/roomietasks.svg" alt="RoomieTasks Logo" className="w-full h-full" style={{ filter: "drop-shadow(0 0 20px rgba(139,92,246,0.4)) drop-shadow(0 0 40px rgba(99,102,241,0.2))" }} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t("no_rooms_yet")}</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            {t("create_room_prompt")}
          </p>
        </div>
      )}

      {/* Drawers */}
      {showCreateDrawer && user && (
        <CreateRoomDrawer userId={user.id} onClose={() => setShowCreateDrawer(false)} />
      )}
      {showJoinDrawer && user && (
        <JoinRoomDrawer userId={user.id} onClose={() => setShowJoinDrawer(false)} />
      )}
      {editingRoom && (
        <RoomSettingsDrawer 
          room={editingRoom} 
          onClose={() => setEditingRoom(null)} 
        />
      )}
    </div>
  );
}
