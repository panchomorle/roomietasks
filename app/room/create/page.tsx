"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useCreateRoom } from "@/hooks/mutations/useTaskMutations";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { getUserTimezone } from "@/lib/timezoneUtils";

export default function CreateRoomPage() {
  const { user } = useAuth();
  const createRoom = useCreateRoom();
  const router = useRouter();
  const setCurrentRoomId = useSetAtom(currentRoomIdAtom);

  const [form, setForm] = useState({
    name: "",
    contributionPerMember: 50,
    periodDurationDays: 30,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const room = await createRoom.mutateAsync({
      name: form.name,
      contributionPerMember: form.contributionPerMember,
      periodDurationDays: form.periodDurationDays,
      userId: user.id,
      timezone: getUserTimezone(),
    });

    setCurrentRoomId(room.id);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950">
      <div className="absolute top-1/3 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />

      <div className="relative w-full max-w-lg">
        <h1 className="text-3xl font-bold text-white mb-2">Create a Room</h1>
        <p className="text-slate-500 mb-8">Set up a new household to start tracking chores.</p>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Room Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
              placeholder="e.g. Apartment 42"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Contribution per Member ($)</label>
            <input
              type="number"
              required
              min={0}
              step={0.01}
              value={form.contributionPerMember}
              onChange={(e) => setForm({ ...form, contributionPerMember: parseFloat(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
            <p className="text-xs text-slate-600 mt-1">Each member contributes this amount to the monthly pool.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Period Duration (days)</label>
            <input
              type="number"
              required
              min={1}
              value={form.periodDurationDays}
              onChange={(e) => setForm({ ...form, periodDurationDays: parseInt(e.target.value) })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>

          <button
            type="submit"
            disabled={createRoom.isPending}
            className="w-full px-6 py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-2xl transition-all hover:shadow-lg hover:shadow-brand-500/20 disabled:opacity-50"
          >
            {createRoom.isPending ? "Creating..." : "Create Room"}
          </button>
        </form>
      </div>
    </div>
  );
}
