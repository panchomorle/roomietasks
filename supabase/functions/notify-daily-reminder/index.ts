import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  getNotificationStrings,
  fillTemplate,
} from "./notificationStrings.ts";

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
// Helpers
// ---------------------------------------------------------------------------


/** Today's date string in UTC, used as the dedup key for daily reminders. */
function todayUtcKey(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
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
    const todayKey = todayUtcKey();

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
      // --- Dedup: skip if we already sent ANY daily reminder today ---
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

      // --- Fetch user language ---
      const { data: profile } = await supabase
        .from("profiles")
        .select("language")
        .eq("id", userId)
        .maybeSingle();

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

        // Compute the current cycle window [cycleStart, cycleEnd)
        const cycleStart = computeCycleStart(
          periodStartIso,
          periodDurationDays,
          cycleMode,
          cyclesPerPeriod,
          cycleAnchorWeekday,
          cycleFixedDays,
          now
        );
        const cycleEnd = computeCycleCutoff(
          periodStartIso,
          periodDurationDays,
          cycleMode,
          cyclesPerPeriod,
          cycleAnchorWeekday,
          cycleFixedDays,
          now
        );

        // Count completed tasks by this user in this cycle
        const { count: completedCount } = await supabase
          .from("task_instances")
          .select("id", { count: "exact", head: true })
          .eq("room_id", roomId)
          .eq("completed_by_user_id", userId)
          .eq("status", "completed")
          .gte("completed_at", cycleStart.toISOString())
          .lt("completed_at", cycleEnd.toISOString());

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
          results.push({ user_id: userId, room: roomName, type: "no_claims" });
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
          results.push({ user_id: userId, room: roomName, type: "claim_more" });
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
