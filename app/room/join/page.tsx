"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useJoinRoom } from "@/hooks/mutations/useTaskMutations";
import { useRouter } from "next/navigation";

export default function JoinRoomPage() {
  const { user } = useAuth();
  const joinRoom = useJoinRoom();
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError("");

    try {
      await joinRoom.mutateAsync({
        inviteCode: inviteCode.trim(),
        userId: user.id,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="absolute bottom-1/3 -right-32 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-2">Join a Room</h1>
        <p className="text-slate-500 mb-8">Enter the invite code shared by your roommate.</p>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Invite Code</label>
            <input
              type="text"
              required
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest text-center placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50 uppercase"
              placeholder="ABCD1234"
              maxLength={8}
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={joinRoom.isPending}
            className="w-full px-6 py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-2xl transition-all hover:shadow-lg hover:shadow-brand-500/20 disabled:opacity-50"
          >
            {joinRoom.isPending ? "Joining..." : "Join Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
