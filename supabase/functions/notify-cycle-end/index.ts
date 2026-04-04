import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
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
  // Construct a Date using UTC setters so that .getFullYear()/.getMonth()
  // etc. return the user's local values.
  return new Date(Date.UTC(c.year, c.month - 1, c.day, c.hour, c.minute, c.second));
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

/** Format minutes into a human-readable string. */
function formatTimeLeft(minutesLeft: number): string {
  const h = Math.floor(minutesLeft / 60);
  const m = minutesLeft % 60;
  if (h > 0 && m > 0) return `${h}h ${m}min`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
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

    // Fetch all rooms that have cycles actively configured
    const { data: rooms, error: roomsError } = await supabase
      .from("rooms")
      .select(
        "id, name, current_period_start_date, period_duration_days, cycle_mode, cycles_per_period, cycle_anchor_weekday, cycle_fixed_days"
      );

    if (roomsError || !rooms) {
      console.error("Failed to fetch rooms:", roomsError);
      return new Response(JSON.stringify({ error: "Room fetch failed" }), {
        status: 500,
      });
    }

    const results = [];

    for (const room of rooms) {
      // Only process rooms with active cycles
      const hasActiveCycles =
        room.cycle_mode === "weekday" ||
        room.cycle_mode === "fixed_days" ||
        (room.cycle_mode === "count" && room.cycles_per_period > 1);

      if (!hasActiveCycles) continue;

      // Fetch all room members with their profile info (language + timezone)
      const { data: members, error: membersError } = await supabase
        .from("room_members")
        .select("user_id, profiles(language, timezone)")
        .eq("room_id", room.id);

      if (membersError || !members || members.length === 0) continue;

      for (const member of members) {
        const userId = member.user_id;
        const profile = (member as unknown as { profiles: { language?: string; timezone?: string } | null }).profiles;
        const userTz = profile?.timezone || "UTC";

        // Compute cycle cutoff using the user's local timezone perspective.
        // For weekday mode this is critical — "next Saturday" depends on
        // what day it currently is in the user's timezone, not UTC.
        const userNow = localNow(now, userTz);

        const cycleEnd = computeCycleCutoff(
          room.current_period_start_date,
          room.period_duration_days,
          room.cycle_mode,
          room.cycles_per_period,
          room.cycle_anchor_weekday,
          room.cycle_fixed_days,
          userNow
        );

        // diffMin: how many minutes until the NEXT cycle end (for warning notifs).
        const diffMs = cycleEnd.getTime() - userNow.getTime();
        const diffMin = Math.round(diffMs / 60000);

        // For cycle_ended we need to detect when the PREVIOUS cutoff just passed.
        // At the exact boundary, computeCycleCutoff jumps forward to the next cycle
        // (diff=0 becomes +7 in weekday mode), so we can't use diffMin≈0.
        // Instead, we compute what the cutoff was 61 minutes ago (safely in the
        // previous cycle window) and check if that boundary just passed.
        const userNowMinus61 = new Date(userNow.getTime() - 61 * 60 * 1000);
        const prevCycleEnd = computeCycleCutoff(
          room.current_period_start_date,
          room.period_duration_days,
          room.cycle_mode,
          room.cycles_per_period,
          room.cycle_anchor_weekday,
          room.cycle_fixed_days,
          userNowMinus61
        );
        // prevCycleEnd just passed if it's within the last 60 minutes
        const prevDiffMin = Math.round((prevCycleEnd.getTime() - userNow.getTime()) / 60000);
        const cycleJustEnded = prevDiffMin > -60 && prevDiffMin <= 0;

        // Evaluate ALL possible notification types for this member.
        type NotifType = "cycle_warning_day" | "cycle_warning_hour" | "cycle_ended";

        const candidates: { type: NotifType; key: string }[] = [];
        if (diffMin >= 1200 && diffMin <= 1680) candidates.push({ type: "cycle_warning_day", key: cycleEnd.toISOString() });  // 20h–28h before
        if (diffMin >= 30   && diffMin <= 90)   candidates.push({ type: "cycle_warning_hour", key: cycleEnd.toISOString() }); // 30–90 min before
        if (cycleJustEnded)                     candidates.push({ type: "cycle_ended", key: prevCycleEnd.toISOString() });    // within 60 min after

        if (candidates.length === 0) continue;

        const lang =
          profile?.language && getNotificationStrings(profile.language)
            ? profile.language
            : "en";

        const s = getNotificationStrings(lang);

        for (const { type: notificationType, key: cycleKey } of candidates) {
          // Check deduplication per notification type
          const { data: existing } = await supabase
            .from("notification_log")
            .select("id")
            .eq("user_id", userId)
            .eq("room_id", room.id)
            .eq("notification_type", notificationType)
            .eq("cycle_key", cycleKey)
            .maybeSingle();

          if (existing) continue; // Already sent — skip

          let title: string;
          let body: string;
          const timeLeft = formatTimeLeft(Math.max(diffMin, 1));

          if (notificationType === "cycle_warning_day") {
            title = s.notif_cycle_warning_day_title;
            body = fillTemplate(s.notif_cycle_warning_day_body, { room: room.name, time: timeLeft });
          } else if (notificationType === "cycle_warning_hour") {
            title = s.notif_cycle_warning_hour_title;
            body = fillTemplate(s.notif_cycle_warning_hour_body, { room: room.name, time: timeLeft });
          } else {
            title = s.notif_cycle_ended_title;
            body = fillTemplate(s.notif_cycle_ended_body, { room: room.name });
          }

          // Dispatch push notification
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

            // Log so we don't re-send
            await supabase.from("notification_log").insert({
              user_id: userId,
              room_id: room.id,
              notification_type: notificationType,
              cycle_key: cycleKey,
            });

            results.push({ room: room.name, user_id: userId, type: notificationType, tz: userTz, sent: true });
          } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            console.error(`Failed to send push to ${userId}:`, message);
            results.push({ room: room.name, user_id: userId, type: notificationType, tz: userTz, sent: false, error: message });
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, processed: results.length, results }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("notify-cycle-end error:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
});
