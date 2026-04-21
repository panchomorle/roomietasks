import type { TranslationKey } from "./translations";

/**
 * Achievement definitions — constants and types.
 * The actual computation happens in the `end_period` RPC (server-side).
 * This file provides the UI mapping for display purposes.
 */

export type AchievementKey = "winner" | "farmer" | "hard_worker" | "troll" | "octopus";

export interface AchievementDef {
  key: AchievementKey;
  emoji: string;
  labelKey: TranslationKey;
  descKey: TranslationKey;
}

export const ACHIEVEMENT_DEFS: Record<AchievementKey, AchievementDef> = {
  winner: {
    key: "winner",
    emoji: "🏆",
    labelKey: "achievement_winner",
    descKey: "achievement_winner_desc",
  },
  farmer: {
    key: "farmer",
    emoji: "🌾",
    labelKey: "achievement_farmer",
    descKey: "achievement_farmer_desc",
  },
  hard_worker: {
    key: "hard_worker",
    emoji: "💪",
    labelKey: "achievement_hard_worker",
    descKey: "achievement_hard_worker_desc",
  },
  troll: {
    key: "troll",
    emoji: "🤡",
    labelKey: "achievement_troll",
    descKey: "achievement_troll_desc",
  },
  octopus: {
    key: "octopus",
    emoji: "🐙",
    labelKey: "achievement_octopus",
    descKey: "achievement_octopus_desc",
  },
};

/**
 * For the EndSeasonModal preview (before the season is actually ended),
 * we compute a preview client-side using the same thresholds as the RPC.
 */
export interface AchievementPreview {
  key: AchievementKey;
  userId: string;
  userName: string;
  metadata: Record<string, number>;
}

export function computeAchievementPreviews(
  tasks: Array<{ completed_by_user_id: string | null; points_reward: number; completerName?: string }>,
  pointLimit: number | null,
  winnerUserId: string | null,
  winnerName: string | null,
  userNameMap: Map<string, string>
): AchievementPreview[] {
  const previews: AchievementPreview[] = [];

  // Winner
  if (winnerUserId) {
    previews.push({
      key: "winner",
      userId: winnerUserId,
      userName: winnerName ?? userNameMap.get(winnerUserId) ?? "?",
      metadata: {},
    });
  }

  if (!pointLimit || pointLimit <= 0) return previews;

  // Aggregate per user
  const userLowPts = new Map<string, number>();
  const userHighPts = new Map<string, number>();
  const userUltraCount = new Map<string, number>();

  for (const task of tasks) {
    const uid = task.completed_by_user_id;
    if (!uid) continue;
    const ratio = task.points_reward / pointLimit;

    if (ratio < 0.15) {
      userLowPts.set(uid, (userLowPts.get(uid) ?? 0) + task.points_reward);
    }
    if (ratio >= 0.50) {
      userHighPts.set(uid, (userHighPts.get(uid) ?? 0) + task.points_reward);
    }
    if (ratio < 0.05) {
      userUltraCount.set(uid, (userUltraCount.get(uid) ?? 0) + 1);
    }
  }

  // Farmer: most low-point sum
  let farmerId: string | null = null;
  let farmerPts = 0;
  for (const [uid, pts] of userLowPts) {
    if (pts > farmerPts) {
      farmerPts = pts;
      farmerId = uid;
    }
  }
  if (farmerId && farmerPts > 0) {
    previews.push({
      key: "farmer",
      userId: farmerId,
      userName: userNameMap.get(farmerId) ?? "?",
      metadata: { points: farmerPts },
    });
  }

  // Hard Worker: most high-point sum
  let hwId: string | null = null;
  let hwPts = 0;
  for (const [uid, pts] of userHighPts) {
    if (pts > hwPts) {
      hwPts = pts;
      hwId = uid;
    }
  }
  if (hwId && hwPts > 0) {
    previews.push({
      key: "hard_worker",
      userId: hwId,
      userName: userNameMap.get(hwId) ?? "?",
      metadata: { points: hwPts },
    });
  }

  // Troll: most ultra-low count
  let trollId: string | null = null;
  let trollCount = 0;
  for (const [uid, count] of userUltraCount) {
    if (count > trollCount) {
      trollCount = count;
      trollId = uid;
    }
  }
  if (trollId && trollCount > 0) {
    previews.push({
      key: "troll",
      userId: trollId,
      userName: userNameMap.get(trollId) ?? "?",
      metadata: { count: trollCount },
    });
  }

  // Octopus: most tasks completed (count-based, all tasks)
  const userTaskCount = new Map<string, number>();
  for (const task of tasks) {
    const uid = task.completed_by_user_id;
    if (!uid) continue;
    userTaskCount.set(uid, (userTaskCount.get(uid) ?? 0) + 1);
  }
  let octopusId: string | null = null;
  let octopusCount = 0;
  for (const [uid, count] of userTaskCount) {
    if (count > octopusCount) {
      octopusCount = count;
      octopusId = uid;
    }
  }
  if (octopusId && octopusCount > 0) {
    previews.push({
      key: "octopus",
      userId: octopusId,
      userName: userNameMap.get(octopusId) ?? "?",
      metadata: { count: octopusCount },
    });
  }

  return previews;
}
