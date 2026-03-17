"use client";

import { useAuth } from "@/hooks/useAuth";
import { useRooms, useRoom } from "@/hooks/queries/useRooms";
import { useCreateRoom, useJoinRoom, useLeaveRoom, useUpdateRoom, usePreviewRoom } from "@/hooks/mutations/useTaskMutations";
import { useAtom } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { DraggableDrawer } from "@/components/DraggableDrawer";

// ─── Create Room Drawer ──────────────────────────────────────
function CreateRoomDrawer({ userId, onClose }: { userId: string; onClose: () => void }) {
  const createRoom = useCreateRoom();
  const [, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const [form, setForm] = useState({
    name: "",
    contribution: 50,
    periodDays: 30,
    pointLimit: 0,
    pointLimitPeriod: "week" as "day" | "week" | "month",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const room = await createRoom.mutateAsync({
      name: form.name,
      contributionPerMember: form.contribution,
      periodDurationDays: form.periodDays,
      userId,
      pointLimit: form.pointLimit > 0 ? form.pointLimit : undefined,
      pointLimitPeriod: form.pointLimit > 0 ? form.pointLimitPeriod : undefined,
    });
    setCurrentRoomId(room.id);
    onClose();
  };

  return (
    <DraggableDrawer onClose={onClose}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">Create a Room</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Household name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
            placeholder="e.g. Apartment 3B"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Contribution ($)</label>
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
            <label className="block text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Period (days)</label>
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
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Point Limit</label>
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
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={form.pointLimit}
              onChange={(e) => setForm({ ...form, pointLimit: parseInt(e.target.value) || 0 })}
              className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
              placeholder="No limit"
            />
            <span className="text-sm font-medium text-slate-500">points/{form.pointLimitPeriod}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">
            Limits how many points a member can earn per {form.pointLimitPeriod}. Set to 0 for no limit.
          </p>
        </div>
        <div className="pt-2">
          <button
            type="submit"
            disabled={createRoom.isPending}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {createRoom.isPending ? "Creating..." : "Create Room"}
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
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Join a Room</h2>
      
      {!roomInfo ? (
        <>
          <p className="text-slate-400 text-sm mb-6">Ask a roommate for the 8-character invite code.</p>
          <form onSubmit={handlePreview} className="space-y-4">
            <input
              type="text"
              required
              maxLength={8}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-5 text-white text-2xl text-center tracking-[0.4em] font-mono font-bold placeholder:text-slate-600 placeholder:tracking-[0.2em] placeholder:text-lg focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              placeholder="INVITE CODE"
            />
            <button
              type="submit"
              disabled={previewRoom.isPending || code.length < 4}
              className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {previewRoom.isPending ? "Searching..." : "Preview Room"}
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
              <span className="text-xs uppercase tracking-widest text-brand-300 font-semibold">Pool Contribution</span>
              <span className="text-3xl font-bold text-white">${roomInfo.contribution_per_member}</span>
              <span className="text-xs text-slate-400">every {roomInfo.period_duration_days} days</span>
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
            <svg className="w-5 h-5 text-brand-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-slate-300">
              By joining this room, you agree to the contribution amount set by the admin.
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
              Cancel
            </button>
            <button
              onClick={handleConfirmJoin}
              disabled={joinRoom.isPending}
              className="flex-[2] py-4 bg-brand-600 hover:bg-brand-500 text-white rounded-2xl font-bold transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
            >
              {joinRoom.isPending ? "Joining..." : "Join & Accept"}
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
  leavePending,
}: {
  membership: any;
  isActive: boolean;
  onSelect: () => void;
  onLeave: () => void;
  leavePending: boolean;
}) {
  const room = membership.rooms;
  const [showInvite, setShowInvite] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingLimits, setIsEditingLimits] = useState(false);
  const [editName, setEditName] = useState(room?.name || "");
  const [editLimit, setEditLimit] = useState(room?.point_limit || 0);
  const [editPeriod, setEditPeriod] = useState((room?.point_limit_period as "day" | "week" | "month") || "week");
  const updateRoom = useUpdateRoom();

  const inviteUrl = room?.invite_code
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/invite/${room.invite_code}`
    : "";

  const handleShare = async () => {
    const shareData = {
      title: `Join "${room?.name}" on RoomieTasks`,
      text: `Your roommate invited you to join "${room?.name}". Tap the link to join!`,
      url: inviteUrl,
    };

    // Use Web Share API on mobile if available
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled or share failed — ignore
      }
    } else {
      // Fallback: copy link to clipboard
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

  const handleSaveName = async () => {
    if (!editName.trim() || editName === room?.name) {
      setIsEditingName(false);
      return;
    }
    await updateRoom.mutateAsync({
      roomId: room.id,
      updates: { name: editName },
    });
    setIsEditingName(false);
  };

  const handleSaveLimits = async () => {
    await updateRoom.mutateAsync({
      roomId: room.id,
      updates: { 
        point_limit: editLimit > 0 ? editLimit : null, 
        point_limit_period: editLimit > 0 ? editPeriod : null 
      },
    });
    setIsEditingLimits(false);
  };

  return (
    <div className={`group bg-white/[0.03] border rounded-[24px] p-5 transition-all ${
      isActive ? "border-brand-500/40 shadow-[0_0_20px_rgba(99,102,241,0.08)]" : "border-white/[0.06]"
    }`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isEditingName ? (
              <div className="flex items-center gap-2 w-full">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="flex-1 bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-lg font-bold focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveName();
                    if (e.key === "Escape") {
                      setEditName(room?.name || "");
                      setIsEditingName(false);
                    }
                  }}
                />
                <button
                  onClick={handleSaveName}
                  disabled={updateRoom.isPending}
                  className="p-1.5 bg-brand-500/20 text-brand-400 hover:bg-brand-500/30 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    setEditName(room?.name || "");
                    setIsEditingName(false);
                  }}
                  className="p-1.5 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-white truncate flex items-center gap-2">
                  {room?.name}
                  {membership.role === "admin" && (
                    <button
                      onClick={() => {
                        setEditName(room?.name || "");
                        setIsEditingName(true);
                      }}
                      className="p-1 text-slate-400 hover:text-brand-400 transition-colors"
                      title="Edit room name"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                  )}
                </h3>
                {isActive && (
                  <span className="flex-shrink-0 px-2 py-0.5 bg-brand-500/20 text-brand-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                    Active
                  </span>
                )}
              </>
            )}
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {membership.role === "admin" ? "Admin" : "Member"} · ${room?.contribution_per_member}/period · {room?.period_duration_days} days
          </p>
          {room?.point_limit ? (
            <p className="text-[10px] text-brand-400/80 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1.5">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.248-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
              </svg>
              Limit: {room.point_limit} pts/{room.point_limit_period}
            </p>
          ) : (
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider mt-1.5">No point limit</p>
          )}
        </div>

        {/* Always-visible Share button */}
        <button
          onClick={handleShare}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-brand-500/15 hover:bg-brand-500/25 active:bg-brand-500/35 text-brand-400 rounded-xl transition-colors text-xs font-semibold"
          title="Share invite link"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          {copied ? "Copied!" : "Share"}
        </button>

        {membership.role === "admin" && (
          <button
            onClick={() => {
              setEditLimit(room?.point_limit || 0);
              setEditPeriod(room?.point_limit_period || "week");
              setIsEditingLimits(true);
            }}
            className="flex-shrink-0 p-2 text-slate-500 hover:text-brand-400 transition-colors"
            title="Edit limits"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 18H7.5m9-6h2.25m-2.25 0a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 12h9.75" />
            </svg>
          </button>
        )}
      </div>

      {isEditingLimits && (
        <div className="mb-4 bg-brand-500/5 border border-brand-500/20 rounded-2xl p-4 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <label className="text-xs font-bold text-brand-300 uppercase tracking-widest">Points Limit</label>
            <div className="flex bg-white/5 rounded-lg p-0.5">
              {(["day", "week", "month"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setEditPeriod(p)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
                    editPeriod === p
                      ? "bg-brand-500 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <input
              type="number"
              min={0}
              value={editLimit}
              onChange={(e) => setEditLimit(parseInt(e.target.value) || 0)}
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white font-bold focus:outline-none focus:ring-1 focus:ring-brand-500/50"
            />
            <span className="text-xs font-medium text-slate-500">pts/{editPeriod}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditingLimits(false)}
              className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveLimits}
              disabled={updateRoom.isPending}
              className="flex-1 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-colors shadow-lg shadow-brand-500/20"
            >
              Save Limits
            </button>
          </div>
        </div>
      )}

      {/* Invite Code Toggle + small copy icon */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex-1 flex items-center justify-between bg-white/5 hover:bg-white/[0.07] active:bg-white/10 rounded-xl px-4 py-3 transition-colors"
          >
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Invite Code</span>
            {showInvite ? (
              <span className="text-white font-mono font-bold tracking-[0.3em] text-sm">{room?.invite_code}</span>
            ) : (
              <span className="text-slate-500 text-xs font-medium">Tap to reveal</span>
            )}
          </button>

          {/* Small icon-only copy link button */}
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
            Switch to this Room
          </button>
        ) : (
          <div className="flex-1 py-3 bg-brand-500/10 text-brand-400/60 rounded-xl font-semibold text-sm text-center cursor-default">
            Currently Active
          </div>
        )}
        <button
          onClick={() => {
            if (confirm(`Leave "${room?.name}"? You will lose access to tasks and history.`)) {
              onLeave();
            }
          }}
          disabled={leavePending}
          className="px-4 py-3 bg-danger/10 hover:bg-danger/20 active:bg-danger/30 text-danger rounded-xl font-semibold text-sm transition-colors flex-shrink-0"
        >
          Leave
        </button>
      </div>
    </div>
  );
}

// ─── Main Rooms Page ─────────────────────────────────────────
export default function RoomsPage() {
  const { user, signOut } = useAuth();
  const { data: rooms, isLoading } = useRooms();
  const [currentRoomId, setCurrentRoomId] = useAtom(currentRoomIdAtom);
  const leaveRoom = useLeaveRoom();
  const router = useRouter();

  const [showCreateDrawer, setShowCreateDrawer] = useState(false);
  const [showJoinDrawer, setShowJoinDrawer] = useState(false);

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

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <div className="pb-10 pt-2">
      {/* Header with Sign-Out */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Your Rooms</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your households</p>
        </div>
        <div className="flex items-center gap-3">
          {user?.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt=""
              className="w-9 h-9 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-sm ring-2 ring-white/10">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          )}
          <button
            onClick={handleSignOut}
            className="p-2 text-slate-500 hover:text-danger active:text-danger hover:bg-danger/10 rounded-xl transition-colors"
            title="Sign out"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
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
          <h3 className="text-white font-bold text-base mb-1">Create</h3>
          <p className="text-slate-500 text-xs leading-relaxed">Start a new household</p>
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
          <h3 className="text-white font-bold text-base mb-1">Join</h3>
          <p className="text-slate-500 text-xs leading-relaxed">Use an invite code</p>
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
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Your Households</h3>
          {rooms.map((membership) => (
            <RoomCard
              key={membership.room_id}
              membership={membership}
              isActive={currentRoomId === membership.room_id}
              onSelect={() => setCurrentRoomId(membership.room_id)}
              onLeave={() => handleLeave(membership.room_id)}
              leavePending={leaveRoom.isPending}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white/[0.02] border border-white/5 rounded-[28px]">
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-5 border border-white/10">
            <svg className="w-9 h-9 text-slate-600" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">No rooms yet</h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto">
            Create a new room to start tracking chores with your roommates, or join one using an invite code.
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
    </div>
  );
}
