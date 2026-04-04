import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getNotificationStrings,
  fillTemplate,
} from "./notificationStrings.ts";

// ---------------------------------------------------------------------------
// Timezone helpers
// ---------------------------------------------------------------------------

/**
 * Returns the local date/time components for a given IANA timezone.
 * Uses Intl.DateTimeFormat so it works correctly in Deno/Edge without
 * any third-party date library.
 */
function getLocalComponents(date: Date, tz: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: string) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  return {
    year: get("year"),
    month: get("month"),   // 1-based
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Builds a fake "now" Date whose UTC components equal the user's local
 * wall-clock time. This lets computeCycleCutoff (which uses getFullYear,
 * getMonth, getDate, getDay — all local-to-the-Date-object methods)
 * produce the same result as the user's browser.
 */
function localNow(utcNow: Date, tz: string): Date {
  const c = getLocalComponents(utcNow, tz);
  return new Date(Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second));
}

/**
 * Returns today's date string in the user's local timezone, used as the
 * dedup key for daily reminders. This ensures a user in UTC-3 whose
 * "today" is April 3 doesn't get deduped against a UTC April 4 key.
 */
function todayLocalKey(utcNow: Date, tz: string): string {
  const c = getLocalComponents(utcNow, tz);
  return `${c.year}-${String(c.month).padStart(2, "0")}-${String(c.day).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Cycle computation (mirrors lib/dateUtils.ts → computeCycleCutoff)
// ---------------------------------------------------------------------------

function computeCycleCutoff(
  periodStartIso: string,
  periodDurationDays: number,
  cycleMode: "count" | "weekday" | "fixed_days",
  cyclesPerPeriod: number,
  cycleAnchorWeekday?: number | null,
  cycleFixedDays?: number | null,
  now: Date = new Date()
): Date {
  const start = new Date(periodStartIso);
  const periodEnd = new Date(
    start.getTime() + periodDurationDays * 24 * 60 * 60 * 1000
  );

  let cutoff: Date;

  if (cycleMode === "count") {
    const cycleDays = periodDurationDays / Math.max(cyclesPerPeriod || 1, 1);
    const startMs = start.getTime();
    const nowMs = now.getTime();
    const passedCycles = Math.floor(
      (Math.max(nowMs, startMs) - startMs) / (cycleDays * 24 * 60 * 60 * 1000)
    );
    cutoff = new Date(
      startMs + (passedCycles + 1) * cycleDays * 24 * 60 * 60 * 1000
    );
  } else if (cycleMode === "fixed_days") {
    const cycleDays = Math.max(cycleFixedDays || 1, 1);
    const startMs = start.getTime();
    const nowMs = now.getTime();
    const passedCycles = Math.floor(
      (Math.max(nowMs, startMs) - startMs) / (cycleDays * 24 * 60 * 60 * 1000)
    );
    cutoff = new Date(
      startMs + (passedCycles + 1) * cycleDays * 24 * 60 * 60 * 1000
    );
  } else if (cycleMode === "weekday") {
    const anchorDay = cycleAnchorWeekday ?? 0;
    const nowMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    );
    const currentDay = nowMidnight.getDay();
    let diff = anchorDay - currentDay;
    if (diff <= 0) diff += 7;
    cutoff = new Date(nowMidnight.getTime() + diff * 24 * 60 * 60 * 1000);
  } else {
    cutoff = periodEnd;
  }

  if (cutoff > periodEnd) return periodEnd;
  if (cutoff < start) return start;
  return cutoff;
}

function computeCycleStart(
  periodStartIso: string,
  periodDurationDays: number,
  cycleMode: "count" | "weekday" | "fixed_days",
  cyclesPerPeriod: number,
  cycleAnchorWeekday?: number | null,
  cycleFixedDays?: number | null,
  now: Date = new Date()
): Date {
  const cutoff = computeCycleCutoff(
    periodStartIso,
    periodDurationDays,
    cycleMode,
    cyclesPerPeriod,
    cycleAnchorWeekday,
    cycleFixedDays,
    now
  );

  const start = new Date(periodStartIso);

  let cycleStart: Date;
  if (cycleMode === "count") {
    const cycleDays = periodDurationDays / Math.max(cyclesPerPeriod || 1, 1);
    cycleStart = new Date(cutoff.getTime() - cycleDays * 24 * 60 * 60 * 1000);
  } else if (cycleMode === "fixed_days") {
    const cycleDays = Math.max(cycleFixedDays || 1, 1);
    cycleStart = new Date(cutoff.getTime() - cycleDays * 24 * 60 * 60 * 1000);
  } else if (cycleMode === "weekday") {
    cycleStart = new Date(cutoff.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    cycleStart = start;
  }

  if (cycleStart < start) return start;
  return cycleStart;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

serve(async () => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date();

    // Fetch every user who has at least one push subscription
    const { data: subscribers, error: subError } = await supabase
      .from("push_subscriptions")
      .select("user_id")
      .not("user_id", "is", null);

    if (subError || !subscribers) {
      console.error("Failed to fetch push_subscriptions:", subError);
      return new Response(JSON.stringify({ error: "Subscriber fetch failed" }), {
        status: 500,
      });
    }

    // Deduplicate user IDs
    const uniqueUserIds = [...new Set(subscribers.map((s) => s.user_id))];

    const results = [];

    for (const userId of uniqueUserIds) {
      // --- Fetch user language + timezone ---
      const { data: profile } = await supabase
        .from("profiles")
        .select("language, timezone")
        .eq("id", userId)
        .maybeSingle();

      const userTz = profile?.timezone || "UTC";
      const todayKey = todayLocalKey(now, userTz);

      // --- Dedup: skip if we already sent ANY daily reminder today (user's local today) ---
      const { data: alreadySent } = await supabase
        .from("notification_log")
        .select("id")
        .eq("user_id", userId)
        .in("notification_type", [
          "daily_reminder_no_claims",
          "daily_reminder_claim_more",
        ])
        .eq("cycle_key", todayKey)
        .limit(1)
        .maybeSingle();

      if (alreadySent) {
        results.push({ user_id: userId, skipped: "already_sent_today" });
        continue;
      }

      const lang =
        profile?.language && getNotificationStrings(profile.language)
          ? profile.language
          : "en";

      const s = getNotificationStrings(lang);

      // --- Fetch all rooms this user belongs to ---
      const { data: memberships, error: memberError } = await supabase
        .from("room_members")
        .select(
          "room_id, rooms(id, name, current_period_start_date, period_duration_days, cycle_mode, cycles_per_period, cycle_anchor_weekday, cycle_fixed_days)"
        )
        .eq("user_id", userId);

      if (memberError || !memberships) continue;

      // Compute user's local "now" for cycle calculations
      const userNow = localNow(now, userTz);

      // Evaluate each room independently and send ONE notification for the
      // first room where the user is eligible (worst-case scenario first)
      let notificationSent = false;

      for (const membership of memberships) {
        if (notificationSent) break;

        const room = (membership as unknown as { rooms: Record<string, unknown> | null }).rooms;
        if (!room) continue;

        const roomId = room.id as string;
        const roomName = room.name as string;
        const cycleMode = room.cycle_mode as "count" | "weekday" | "fixed_days";
        const cyclesPerPeriod = room.cycles_per_period as number;
        const periodStartIso = room.current_period_start_date as string;
        const periodDurationDays = room.period_duration_days as number;
        const cycleAnchorWeekday = room.cycle_anchor_weekday as number | null;
        const cycleFixedDays = room.cycle_fixed_days as number | null;

        // Only process rooms with active cycles
        const hasActiveCycles =
          cycleMode === "weekday" ||
          cycleMode === "fixed_days" ||
          (cycleMode === "count" && cyclesPerPeriod > 1);

        if (!hasActiveCycles) continue;

        // Compute the current cycle window using user's local timezone
        const cycleStart = computeCycleStart(
          periodStartIso,
          periodDurationDays,
          cycleMode,
          cyclesPerPeriod,
          cycleAnchorWeekday,
          cycleFixedDays,
          userNow
        );
        const cycleEnd = computeCycleCutoff(
          periodStartIso,
          periodDurationDays,
          cycleMode,
          cyclesPerPeriod,
          cycleAnchorWeekday,
          cycleFixedDays,
          userNow
        );

        // cycleStart/cycleEnd were computed using userNow (a fake-UTC Date whose
        // UTC components = user's local wall-clock). But completed_at in the DB is
        // stored in real UTC. We must convert back to real UTC before querying.
        //
        // tzOffsetMs = how many ms userNow is ahead of real now (positive for UTC+,
        // negative for UTC-).  For America/Buenos_Aires (UTC-3) this is -10800000.
        const tzOffsetMs = userNow.getTime() - now.getTime();
        const realCycleStartUtc = new Date(cycleStart.getTime() - tzOffsetMs);
        const realCycleEndUtc = new Date(cycleEnd.getTime() - tzOffsetMs);

        // Count completed tasks by this user in this cycle
        const { count: completedCount } = await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true })
          .eq("room_id", roomId)
          .eq("completed_by_user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", realCycleStartUtc.toISOString())
          .lt("completed_at", realCycleEndUtc.toISOString());

        // Count pending (claimed but not yet completed) tasks by this user
        const { count: pendingCount } = await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true })
          .eq("room_id", roomId)
          .eq("assigned_user_id", userId)
          .eq("status", "pending");

        const completed = completedCount ?? 0;
        const pending = pendingCount ?? 0;

        // Scenario A: zero activity at all
        if (completed === 0 && pending === 0) {
          await sendReminder(
            supabaseUrl,
            supabaseServiceKey,
            supabase,
            userId,
            roomId,
            roomName,
            "daily_reminder_no_claims",
            todayKey,
            s.notif_daily_no_claims_title,
            fillTemplate(s.notif_daily_no_claims_body, { room: roomName })
          );
          notificationSent = true;
          results.push({ user_id: userId, room: roomName, type: "no_claims", tz: userTz });
        }
        // Scenario B: has completed work but no active claims
        else if (completed > 0 && pending === 0) {
          await sendReminder(
            supabaseUrl,
            supabaseServiceKey,
            supabase,
            userId,
            roomId,
            roomName,
            "daily_reminder_claim_more",
            todayKey,
            s.notif_daily_claim_more_title,
            fillTemplate(s.notif_daily_claim_more_body, { room: roomName })
          );
          notificationSent = true;
          results.push({ user_id: userId, room: roomName, type: "claim_more", tz: userTz });
        }
      }

      if (!notificationSent) {
        results.push({ user_id: userId, skipped: "has_active_claims" });
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("notify-daily-reminder error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});

// ---------------------------------------------------------------------------
// Shared helper
// ---------------------------------------------------------------------------

async function sendReminder(
  supabaseUrl: string,
  supabaseServiceKey: string,
  supabase: SupabaseClient,
  userId: string,
  roomId: string,
  _roomName: string,
  notificationType: string,
  cycleKey: string,
  title: string,
  body: string
) {
  try {
    await fetch(`${supabaseUrl}/functions/v1/send-push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        target_user_id: userId,
        title,
        body,
        url: "/dashboard",
      }),
    });

    await supabase.from("notification_log").insert({
      user_id: userId,
      room_id: roomId,
      notification_type: notificationType,
      cycle_key: cycleKey,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Failed to send reminder to ${userId}:`, message);
  }
}
