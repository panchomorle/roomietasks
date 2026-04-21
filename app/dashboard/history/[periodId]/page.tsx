"use client";

import { useParams, useRouter } from "next/navigation";
import { useSeasonDetail } from "@/hooks/queries/useSeasonData";
import { useTranslation } from "@/hooks/useTranslation";
import { formatPoints } from "@/lib/numberUtils";
import { formatSeasonLabel } from "@/lib/seasonLabel";
import { ACHIEVEMENT_DEFS } from "@/lib/achievements";
import type { AchievementKey } from "@/lib/achievements";

export default function SeasonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const periodId = params.periodId as string;
  const { t, language } = useTranslation();
  const { data, isLoading } = useSeasonDetail(periodId);

  if (isLoading) {
    return (
      <div className="pb-20 pt-2">
        <div className="h-8 w-20 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="h-48 bg-white/[0.03] rounded-3xl animate-pulse mb-4" />
        <div className="h-32 bg-white/[0.03] rounded-3xl animate-pulse mb-4" />
        <div className="h-64 bg-white/[0.03] rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!data || !data.period) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Season not found.</p>
      </div>
    );
  }

  const { period, userHistory, achievements } = data;
  const totalPool = Number(period.total_pool);
  const totalPoints = Number(period.total_points);

  // Build participant list from userHistory
  const participants = (userHistory ?? []).map((uh) => {
    const profile = (uh as any).profile as { full_name: string | null; avatar_url: string | null; email: string | null } | null;
    const points = Number(uh.points_earned);
    const money = Number(uh.money_received);
    const pct = totalPoints > 0 ? (points / totalPoints) * 100 : 0;
    return {
      userId: uh.user_id,
      points,
      money,
      pct,
      fullName: profile?.full_name ?? profile?.email ?? "?",
      avatarUrl: profile?.avatar_url ?? null,
    };
  });

  const totalTasks = participants.reduce((sum, p) => sum + p.points, 0); // using points as proxy
  const top3 = participants.slice(0, 3);

  // Build podium
  const rankMeta = [
    { height: "h-28", color: "bg-yellow-500", label: "1st", textColor: "text-slate-900", ringColor: "ring-yellow-500", size: "110px", avatarSize: "w-14 h-14 text-lg" },
    { height: "h-20", color: "bg-slate-400", label: "2nd", textColor: "text-slate-900", ringColor: "ring-white/20", size: "90px", avatarSize: "w-10 h-10 text-sm" },
    { height: "h-16", color: "bg-amber-700", label: "3rd", textColor: "text-white", ringColor: "ring-white/20", size: "90px", avatarSize: "w-10 h-10 text-sm" },
  ];
  const podiumEntries = top3.map((entry, i) => ({ ...entry, meta: rankMeta[i] }));
  const podiumOrder =
    podiumEntries.length >= 3
      ? [podiumEntries[1], podiumEntries[0], podiumEntries[2]]
      : podiumEntries;

  // Achievement map for easy lookup
  const achievementsList = (achievements ?? []).map((a) => {
    const profile = (a as any).profile as { full_name: string | null; avatar_url: string | null } | null;
    return {
      key: a.key as AchievementKey,
      userId: a.user_id,
      userName: profile?.full_name ?? "?",
      avatarUrl: profile?.avatar_url ?? null,
      metadata: (a.metadata as Record<string, number>) ?? {},
    };
  });

  return (
    <div className="pb-20 pt-2">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        {t("back")}
      </button>

      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black text-white">{t("season_details")}</h1>
        <p className="text-lg font-bold text-brand-400 mt-1">
          {formatSeasonLabel(period.period_start, period.period_end, language as "en" | "es")}
        </p>
      </div>

      {/* Stats Row */}
      <div className="flex justify-center gap-6 px-4 py-4 mb-4">
        <div className="text-center">
          <p className="text-2xl font-black text-white">${totalPool.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t("prize_pool")}</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-black text-brand-400">{formatPoints(totalPoints, language as "en" | "es")}</p>
          <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">{t("total_points")}</p>
        </div>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-[28px] p-6 mb-4">
          <div className="flex items-end justify-center gap-3">
            {podiumOrder.map((entry) => {
              if (!entry) return null;
              const { meta } = entry;
              const isFirst = meta.label === "1st";
              return (
                <div key={entry.userId} className="flex flex-col items-center" style={{ width: meta.size }}>
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      className={`rounded-full object-cover ring-2 mb-2 ${
                        isFirst ? `w-14 h-14 ${meta.ringColor}` : `w-10 h-10 ${meta.ringColor}`
                      }`}
                    />
                  ) : (
                    <div
                      className={`rounded-full bg-brand-600/30 flex items-center justify-center font-bold text-brand-400 mb-2 ring-2 ${meta.ringColor} ${meta.avatarSize}`}
                    >
                      {(entry.fullName ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="text-xs font-semibold text-white truncate w-full text-center">{entry.fullName}</p>
                  <p className="text-[10px] text-slate-400">
                    {formatPoints(entry.points, language as "en" | "es")} {t("pts")}
                  </p>
                  <div className={`w-full ${meta.height} ${meta.color} rounded-t-xl mt-2 flex items-center justify-center`}>
                    <span className={`text-xs font-black ${meta.textColor}`}>{meta.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievementsList.length > 0 && (
        <div className="mb-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-3">{t("achievements")}</h3>
          <div className="grid grid-cols-2 gap-2">
            {achievementsList.map((ach) => {
              const def = ACHIEVEMENT_DEFS[ach.key];
              if (!def) return null;
              return (
                <div
                  key={ach.key}
                  className="bg-white/[0.04] border border-white/[0.08] rounded-2xl p-4 flex items-center gap-3"
                >
                  <span className="text-3xl flex-shrink-0">{def.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-white">{t(def.labelKey)}</p>
                    <p className="text-xs text-slate-400 truncate">{ach.userName}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{t(def.descKey)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Prize Distribution */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-[28px] p-4">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 mb-2">{t("prize_distribution")}</h3>
        <div className="space-y-1">
          {participants.map((entry, i) => (
            <div key={entry.userId} className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/[0.03]">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-xs font-bold text-slate-500 text-center flex-shrink-0">{i + 1}</span>
                {entry.avatarUrl ? (
                  <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-white/10 flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center flex-shrink-0 text-brand-400 font-bold text-xs ring-1 ring-brand-500/20">
                    {(entry.fullName ?? "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{entry.fullName}</p>
                  <p className="text-[11px] text-slate-500">
                    {formatPoints(entry.points, language as "en" | "es")} {t("pts")} &middot; {entry.pct.toFixed(1)}%
                  </p>
                </div>
              </div>
              <p className={`text-sm font-bold flex-shrink-0 ${i === 0 && entry.points > 0 ? "text-success" : "text-slate-300"}`}>
                ${entry.money.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
