"use client";

import { useState } from "react";
import { DraggableDrawer } from "./DraggableDrawer";
import { useUpdateRoom } from "@/hooks/mutations/useTaskMutations";
import { useTranslation } from "@/hooks/useTranslation";

interface RoomSettingsDrawerProps {
  room: any;
  onClose: () => void;
}

export function RoomSettingsDrawer({ room, onClose }: RoomSettingsDrawerProps) {
  const { t } = useTranslation();
  const updateRoom = useUpdateRoom();
  const [form, setForm] = useState({
    name: room.name,
    contribution: room.contribution_per_member,
    periodDays: room.period_duration_days,
    pointLimit: room.point_limit || 0,
    pointLimitPeriod: (room.point_limit_period as "day" | "week" | "month") || "week",
    cooldownDays: room.recurrent_cooldown_days || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateRoom.mutateAsync({
      roomId: room.id,
      updates: {
        name: form.name,
        contribution_per_member: form.contribution,
        period_duration_days: form.periodDays,
        point_limit: form.pointLimit > 0 ? form.pointLimit : null,
        point_limit_period: form.pointLimit > 0 ? form.pointLimitPeriod : null,
        recurrent_cooldown_days: form.cooldownDays,
      } as any,
    });
    onClose();
  };

  return (
    <DraggableDrawer onClose={onClose}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">{t("room_settings")}</h2>

      <form onSubmit={handleSubmit} className="space-y-4 pb-8">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("household_name")}</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 font-medium"
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
              value={form.pointLimit}
              onChange={(e) => setForm({ ...form, pointLimit: parseInt(e.target.value) || 0 })}
              className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
              placeholder={t("no_limit")}
            />
            <span className="text-sm font-medium text-slate-500">{t("pts")}/{t(form.pointLimitPeriod)}</span>
          </div>
        </div>

        <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-4">
          <label className="block text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">{t("recurrent_cooldown")}</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={0}
              value={form.cooldownDays}
              onChange={(e) => setForm({ ...form, cooldownDays: parseInt(e.target.value) || 0 })}
              className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
            />
            <span className="text-sm font-medium text-slate-500">{t("day")}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
            {t("cooldown_description")}
          </p>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={updateRoom.isPending}
            className="w-full py-4 bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white rounded-2xl font-bold text-lg transition-colors shadow-lg shadow-brand-500/20 disabled:opacity-50"
          >
            {updateRoom.isPending ? t("saving") : t("save_settings")}
          </button>
        </div>
      </form>
    </DraggableDrawer>
  );
}
