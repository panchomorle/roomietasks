"use client";

import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/queries/useProfile";
import { useUserAchievements } from "@/hooks/queries/useUserAchievements";
import { useAtomValue } from "jotai";
import { currentRoomIdAtom } from "@/store/atoms";
import { useTranslation } from "@/hooks/useTranslation";
import { ACHIEVEMENT_DEFS } from "@/lib/achievements";
import type { AchievementKey } from "@/lib/achievements";
import Link from "next/link";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function UserProfilePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const roomId = useAtomValue(currentRoomIdAtom);

  const { data: profile, isLoading: profileLoading } = useProfile(userId);
  const { data: achievementMap, isLoading: achLoading } = useUserAchievements(userId, roomId);

  const isOwnProfile = user?.id === userId;
  const isLoading = profileLoading || achLoading;

  const displayName = profile?.full_name || profile?.email || "?";
  const initials = displayName.charAt(0).toUpperCase();

  // All 5 achievement types to always display the full panel
  const allKeys: AchievementKey[] = ["winner", "octopus", "hard_worker", "farmer", "troll"];

  if (isLoading) {
    return (
      <div className="pb-20 pt-2">
        <div className="h-8 w-20 bg-white/5 rounded-lg animate-pulse mb-6" />
        <div className="h-40 bg-white/[0.03] rounded-3xl animate-pulse mb-6" />
        <div className="h-64 bg-white/[0.03] rounded-3xl animate-pulse" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Profile not found.</p>
      </div>
    );
  }

  return (
    <div className="pb-20 pt-2">
      {/* Header Area */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          {t("back")}
        </button>
        <LanguageSwitcher />
      </div>

      {/* Profile Card */}
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-[28px] p-6 mb-8 flex items-center gap-5 relative">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-20 h-20 rounded-[22px] object-cover ring-4 ring-white/5 flex-shrink-0"
          />
        ) : (
          <div className="w-20 h-20 rounded-[22px] bg-brand-600/30 flex items-center justify-center text-brand-400 font-bold text-2xl ring-4 ring-white/5 flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-white truncate">{displayName}</h1>
          <p className="text-sm text-slate-400 truncate mt-0.5">{profile.email}</p>
          {isOwnProfile && (
            <span className="inline-block mt-1.5 text-[10px] font-bold text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
              {t("you")}
            </span>
          )}
        </div>
        {/* Gear icon for own profile → Settings */}
        {isOwnProfile && (
          <Link
            href="/dashboard/settings"
            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
            title={t("settings")}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.093c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93.398.164.855.142 1.205-.108l.737-.527a1.125 1.125 0 011.45.12l.773.774c.39.389.44 1.002.12 1.45l-.527.737c-.25.35-.272.806-.107 1.204.165.397.505.71.93.78l.893.15c.543.09.94.56.94 1.109v1.094c0 .55-.397 1.02-.94 1.11l-.893.149c-.425.07-.765.383-.93.78-.165.398-.143.854.107 1.204l.527.738c.32.447.269 1.06-.12 1.45l-.774.773a1.125 1.125 0 01-1.449.12l-.738-.527c-.35-.25-.806-.272-1.203-.107-.397.165-.71.505-.781.929l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.019-.398-1.11-.94l-.148-.894c-.071-.424-.384-.764-.781-.93-.398-.164-.854-.142-1.204.108l-.738.527c-.447.32-1.06.269-1.45-.12l-.773-.774a1.125 1.125 0 01-.12-1.45l.527-.737c.25-.35.273-.806.108-1.204-.165-.397-.505-.71-.93-.78l-.894-.15c-.542-.09-.94-.56-.94-1.109v-1.094c0-.55.398-1.02.94-1.11l.894-.149c.424-.07.765-.383.93-.78.165-.398.143-.854-.107-1.204l-.527-.738a1.125 1.125 0 01.12-1.45l.773-.773a1.125 1.125 0 011.45-.12l.737.527c.35.25.807.272 1.204.107.397-.165.71-.505.78-.929l.15-.894z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </Link>
        )}
      </div>

      {/* Achievements Panel */}
      <div>
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">
          {t("achievements")}
        </h2>

        {achievementMap && achievementMap.size === 0 && (
          <p className="text-slate-500 text-sm text-center mb-4">{t("no_achievements_yet")}</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allKeys.map((key) => {
            const def = ACHIEVEMENT_DEFS[key];
            const count = achievementMap?.get(key) ?? 0;
            const hasAchievement = count > 0;

            return (
              <div
                key={key}
                className={`relative flex flex-col items-center justify-center gap-2 p-5 rounded-[24px] border transition-all ${
                  hasAchievement
                    ? "bg-gradient-to-br from-white/[0.06] to-white/[0.03] border-white/[0.10] shadow-sm"
                    : "bg-white/[0.02] border-white/[0.04] opacity-40"
                }`}
              >
                {/* Count badge */}
                {count > 1 && (
                  <div className="absolute top-3 right-3 bg-yellow-500 text-slate-900 text-[10px] font-black px-1.5 py-0.5 rounded-md leading-none">
                    {t("times_awarded").replace("{count}", count.toString())}
                  </div>
                )}

                {/* Emoji */}
                <span
                  className={`text-5xl leading-none transition-all ${
                    hasAchievement ? "drop-shadow-lg" : "grayscale"
                  }`}
                >
                  {def.emoji}
                </span>

                {/* Label */}
                <div className="text-center">
                  <p className={`text-sm font-bold leading-tight ${hasAchievement ? "text-white" : "text-slate-500"}`}>
                    {t(def.labelKey)}
                  </p>
                  <p className={`text-[10px] mt-0.5 ${hasAchievement ? "text-slate-400" : "text-slate-600"}`}>
                    {t(def.descKey)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
