"use client";

import { useState } from "react";
import { DraggableDrawer } from "./DraggableDrawer";
import { useUpdateRoom } from "@/hooks/mutations/useTaskMutations";
import { useTranslation } from "@/hooks/useTranslation";
import { computeCycleCutoff } from "@/lib/dateUtils";
import { format } from "date-fns";
import { enUS, es } from "date-fns/locale";

interface RoomSettingsDrawerProps {
  room: any;
  onClose: () => void;
}

function InfoTooltip({ text, align = "center" }: { text: string; align?: "left" | "center" | "right" }) {
  const [open, setOpen] = useState(false);

  const bubbleClasses =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "right"
      ? "right-[-10px]"
      : "left-[-10px]";

  const arrowClasses =
    align === "center"
      ? "left-1/2 -translate-x-1/2"
      : align === "right"
      ? "right-3"
      : "left-3";

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-5 h-5 rounded-full bg-white/10 text-slate-400 hover:text-white hover:bg-white/20 transition-all flex items-center justify-center text-[11px] font-bold leading-none"
        aria-label="Info"
      >
        i
      </button>
      {open && (
        <div className={`absolute bottom-7 w-56 bg-slate-800 border border-white/10 rounded-xl p-3 shadow-xl z-50 animate-fade-in ${bubbleClasses}`}>
          <p className="text-[11px] text-slate-300 leading-relaxed">{text}</p>
          <div className={`absolute bottom-[-5px] w-2.5 h-2.5 bg-slate-800 border-b border-r border-white/10 rotate-45 ${arrowClasses}`} />
        </div>
      )}
    </div>
  );
}

function SectionLabel({ label, info, align = "center", className = "" }: { label: string; info: string; align?: "left" | "center" | "right"; className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
      <InfoTooltip text={info} align={align} />
    </div>
  );
}

export function RoomSettingsDrawer({ room, onClose }: RoomSettingsDrawerProps) {
  const { t } = useTranslation();
  const updateRoom = useUpdateRoom();

  const hasCycles = (room.cycles_per_period || 1) > 1 || room.cycle_mode !== "count";

  const [form, setForm] = useState({
    name: room.name,
    contribution: room.contribution_per_member,
    periodDays: String(room.period_duration_days || 30),
    pointLimit: room.point_limit != null ? String(room.point_limit) : "0",
    pointLimitPeriod: (room.point_limit_period as "day" | "week" | "month" | "cycle") || "week",
    cooldownDays: room.recurrent_cooldown_days || 0,
    cyclesEnabled: hasCycles,
    cycleMode: room.cycle_mode || "count",
    cyclesPerPeriod: String(room.cycles_per_period || 2),
    cycleAnchorWeekday: room.cycle_anchor_weekday ?? 1, // 1=Mon default
    cycleFixedDays: String(room.cycle_fixed_days || 7),
    seasonStartDate: (() => {
      const d = new Date(room.current_period_start_date || new Date());
      return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0');
    })(),
  });

  const isSpanish = t("language") === "Español";
  const dateLocale = isSpanish ? es : enUS;

  const previewCutoff = form.cyclesEnabled
    ? computeCycleCutoff(
        new Date(form.seasonStartDate).toISOString(),
        parseInt(form.periodDays) || 30,
        form.cycleMode as any,
        parseInt(form.cyclesPerPeriod) || 2,
        form.cycleAnchorWeekday,
        parseInt(form.cycleFixedDays) || 7
      )
    : null;

  const isPointLimitActive = (parseFloat(form.pointLimit as string) || 0) > 0;
  const availablePeriods: ("day" | "week" | "month" | "cycle")[] = ["day", "week", "month", ...(form.cyclesEnabled ? ["cycle" as const] : [])];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // When cycles are disabled, persist 1 cycle and default count mode
    const cyclesPerPeriod = form.cyclesEnabled
      ? parseInt(form.cyclesPerPeriod) || 2
      : 1;
    const cycleMode = form.cyclesEnabled ? (form.cycleMode as any) : "count";
    // If cycle was selected as limit period but cycles got disabled, fall back to week
    const pointLimitPeriod = (isPointLimitActive && form.pointLimitPeriod === "cycle" && !form.cyclesEnabled)
      ? "week"
      : form.pointLimitPeriod;

    await updateRoom.mutateAsync({
      roomId: room.id,
      updates: {
        name: form.name,
        contribution_per_member: form.contribution,
        period_duration_days: parseInt(form.periodDays) || 30,
        current_period_start_date: new Date(form.seasonStartDate).toISOString(),
        point_limit: isPointLimitActive ? parseFloat(form.pointLimit as string) : null,
        point_limit_period: isPointLimitActive ? pointLimitPeriod : null,
        recurrent_cooldown_days: form.cooldownDays,
        cycle_mode: cycleMode,
        cycles_per_period: cyclesPerPeriod,
        cycle_anchor_weekday: form.cycleAnchorWeekday,
        cycle_fixed_days: parseInt(form.cycleFixedDays) || 7,
      } as any,
    });
    onClose();
  };

  const dayLabels = [t("day_s"), t("day_m"), t("day_t"), t("day_w"), t("day_th"), t("day_f"), t("day_sa")];

  return (
    <DraggableDrawer onClose={onClose}>
      <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">{t("room_settings")}</h2>

      <form onSubmit={handleSubmit} className="space-y-4 pb-8">

        {/* 1 – Room Name */}
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

        {/* 2 – Season Start Date */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <SectionLabel label={t("season_start_date")} info={t("info_season_start")} align="left" className="mb-2" />
          <input
            type="date"
            required
            value={form.seasonStartDate}
            onChange={(e) => setForm({ ...form, seasonStartDate: e.target.value })}
            className="w-full bg-transparent text-lg font-bold text-white focus:outline-none [color-scheme:dark]"
          />
          {new Date(form.seasonStartDate) > new Date() && (
            <div className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
              <p className="text-[11px] text-amber-400/90 font-medium">{t("season_start_warning_future")}</p>
            </div>
          )}
          {new Date(form.seasonStartDate).getTime() + (parseInt(form.periodDays) || 30) * 24 * 3600 * 1000 <= new Date().getTime() && (
            <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-[11px] text-red-400/90 font-medium">{t("season_start_warning_expired")}</p>
            </div>
          )}
        </div>

        {/* 3 – Contribution + Season Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <SectionLabel label={t("contribution_label")} info={t("info_contribution")} align="left" className="mb-2" />
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
            <SectionLabel label={t("season_days_label")} info={t("info_season")} align="right" className="mb-2" />
            <div className="flex items-end gap-1">
              <input
                type="number"
                min={1}
                required
                value={form.periodDays}
                onChange={(e) => setForm({ ...form, periodDays: e.target.value })}
                className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
              />
              <span className="text-xs text-slate-500 mb-1">{t("days")}</span>
            </div>
          </div>
        </div>

        {/* 4 – Cycle Mode */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
          {/* Header with toggle */}
          <div className="flex items-center justify-between">
            <SectionLabel label={t("cycles_enabled")} info={t("info_cycles")} align="left" />
            <button
              type="button"
              onClick={() => {
                const next = !form.cyclesEnabled;
                setForm({
                  ...form,
                  cyclesEnabled: next,
                  // If disabling cycles and point limit was set to cycle, revert to week
                  pointLimitPeriod: (!next && form.pointLimitPeriod === "cycle") ? "week" : form.pointLimitPeriod,
                });
              }}
              className={`relative inline-flex items-center h-6 w-11 rounded-full transition-colors focus:outline-none ${
                form.cyclesEnabled ? "bg-brand-500" : "bg-white/10"
              }`}
            >
              <span
                className={`inline-block w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  form.cyclesEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {form.cyclesEnabled ? (
            <>
              {/* Mode picker */}
              <div className="flex bg-white/5 rounded-xl p-1">
                {(["count", "weekday", "fixed_days"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm({ ...form, cycleMode: mode })}
                    className={`flex-1 px-2 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                      form.cycleMode === mode ? "bg-white/10 text-white shadow" : "text-slate-500 hover:text-slate-300"
                    }`}
                  >
                    {t(`cycle_mode_${mode === "fixed_days" ? "fixed" : mode}` as any)}
                  </button>
                ))}
              </div>

              {/* Count mode */}
              {form.cycleMode === "count" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("cycles_per_season")}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={2}
                      max={30}
                      value={form.cyclesPerPeriod}
                      onChange={(e) => setForm({ ...form, cyclesPerPeriod: e.target.value })}
                      className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
                    />
                    <span className="text-sm font-medium text-slate-500">{t("cycles_per_season")}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{t("cycles_per_period_description")}</p>
                </div>
              )}

              {/* Weekday mode */}
              {form.cycleMode === "weekday" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">{t("cycle_anchor_weekday_label")}</label>
                  <div className="flex justify-between gap-1">
                    {dayLabels.map((label, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setForm({ ...form, cycleAnchorWeekday: idx })}
                        className={`w-10 h-10 rounded-full text-sm font-bold transition-all ${
                          form.cycleAnchorWeekday === idx
                            ? "bg-brand-500 text-white shadow-md shadow-brand-500/30"
                            : "bg-white/5 text-slate-500 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Fixed days mode */}
              {form.cycleMode === "fixed_days" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t("cycle_fixed_days_label")}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={90}
                      value={form.cycleFixedDays}
                      onChange={(e) => setForm({ ...form, cycleFixedDays: e.target.value })}
                      className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
                    />
                    <span className="text-sm font-medium text-slate-500">{t("days")}</span>
                  </div>
                </div>
              )}

              {/* Preview hint */}
              {previewCutoff && (
                <div className="pt-3 border-t border-white/5">
                  <p className="text-xs text-brand-400 font-medium">
                    {t("cycle_next_preview")} <span className="text-white ml-1">{format(previewCutoff, "EEEE, MMM d", { locale: dateLocale })}</span>
                  </p>
                </div>
              )}
            </>
          ) : (
            <p className="text-[11px] text-slate-500 leading-relaxed">{t("cycles_disabled_info")}</p>
          )}
        </div>

        {/* 5 – Point Limit */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <SectionLabel label={t("point_limit")} info={t("info_point_limit")} align="left" />
            <div className="flex bg-white/5 rounded-lg p-0.5">
              {availablePeriods.map((p) => (
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
                  {t(p as any)}
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
            <span className="text-sm font-medium text-slate-500">{t("pts")}/{t(form.pointLimitPeriod as any)}</span>
          </div>
        </div>

        {/* 6 – Cooldown */}
        <div className="bg-brand-500/5 border border-brand-500/20 rounded-2xl p-4">
          <SectionLabel label={t("recurrent_cooldown")} info={t("info_cooldown")} align="left" className="mb-2" />
          <div className="flex items-center gap-3 mt-2">
            <input
              type="number"
              min={0}
              value={form.cooldownDays}
              onChange={(e) => setForm({ ...form, cooldownDays: parseInt(e.target.value) || 0 })}
              className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none"
            />
            <span className="text-sm font-medium text-slate-500">{form.cooldownDays === 1 ? t("day") : t("days")}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{t("cooldown_description")}</p>
        </div>

        {/* Save */}
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
