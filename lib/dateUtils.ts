import { differenceInCalendarDays, format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';
import { getDayOfWeekInTimezone, getLocalMidnight } from './timezoneUtils';

export function formatTaskDate(dateValue: string | Date, language: 'en' | 'es'): string {
  const date = typeof dateValue === 'string' ? new Date(dateValue) : dateValue;
  const now = new Date();

  // Tasks are stored as UTC midnight (e.g. 2026-03-20T00:00:00Z) but represent 
  // the local day. Parsing them directly causes them to shift back a day in Western 
  // timezones. We extract the UTC components to reconstruct an accurate local date.
  const dateMidnight = new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  
  const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const locale = language === 'es' ? es : enUS;
  
  const diffDays = differenceInCalendarDays(dateMidnight, nowMidnight);

  if (diffDays === 0) {
    return language === 'es' ? 'hoy' : 'today';
  } else if (diffDays === 1) {
    return language === 'es' ? 'mañana' : 'tomorrow';
  } else if (diffDays === -1) {
    return language === 'es' ? 'ayer' : 'yesterday';
  }

  // If outside the -6 to 6 day range, fallback to typical short date like "Mar 18" or "18 mar."
  if (Math.abs(diffDays) >= 7) {
    return format(dateMidnight, 'MMM d', { locale });
  }

  // Use format for day of week "EEEE" for dates within next/last 6 days
  // EEEE outputs "Tuesday", "lunes", etc.
  return format(dateMidnight, 'EEEE', { locale });
}

/**
 * Returns the UTC Date that marks the end of the current cycle.
 *
 * @param timezone IANA timezone string for the room (e.g. "America/Argentina/Buenos_Aires").
 *   Defaults to 'UTC'. All members of a room share the same timezone so cycle boundaries
 *   are identical for everyone — this must be the ROOM's timezone, not the viewer's.
 */
export function computeCycleCutoff(
  periodStartIso: string,
  periodDurationDays: number,
  cycleMode: 'count' | 'weekday' | 'fixed_days',
  cyclesPerPeriod: number,
  cycleAnchorWeekday?: number | null,
  cycleFixedDays?: number | null,
  timezone: string = 'UTC'
): Date {
  const start = new Date(periodStartIso);
  const now = new Date();
  const periodEnd = new Date(start.getTime() + periodDurationDays * 24 * 60 * 60 * 1000);

  let cutoff: Date;

  if (cycleMode === 'count') {
    const cycleDays = periodDurationDays / Math.max(cyclesPerPeriod || 1, 1);
    const startMs = start.getTime();
    const nowMs = now.getTime();
    // count/fixed_days modes divide absolute time evenly — no timezone needed.
    const passedCycles = Math.floor((Math.max(nowMs, startMs) - startMs) / (cycleDays * 24 * 60 * 60 * 1000));
    cutoff = new Date(startMs + (passedCycles + 1) * cycleDays * 24 * 60 * 60 * 1000);
  } else if (cycleMode === 'fixed_days') {
    const cycleDays = Math.max(cycleFixedDays || 1, 1);
    const startMs = start.getTime();
    const nowMs = now.getTime();
    const passedCycles = Math.floor((Math.max(nowMs, startMs) - startMs) / (cycleDays * 24 * 60 * 60 * 1000));
    cutoff = new Date(startMs + (passedCycles + 1) * cycleDays * 24 * 60 * 60 * 1000);
  } else if (cycleMode === 'weekday') {
    // Find the next occurrence of the anchor weekday in the ROOM's timezone.
    // Using the room timezone ensures all members see the same cutoff moment.
    const anchorDay = cycleAnchorWeekday ?? 0; // 0=Sun
    const nowMidnight = getLocalMidnight(now, timezone);
    const currentDay = getDayOfWeekInTimezone(now, timezone);

    let diff = anchorDay - currentDay;
    if (diff <= 0) {
      diff += 7; // if today IS the anchor day (diff=0) advance a full week
    }

    cutoff = new Date(nowMidnight.getTime() + diff * 24 * 60 * 60 * 1000);
  } else {
    cutoff = periodEnd;
  }

  if (cutoff > periodEnd) return periodEnd;
  if (cutoff < start) return start;
  return cutoff;
}

/** Returns the UTC Date that marks the start of the current cycle. */
export function computeCycleStart(
  periodStartIso: string,
  periodDurationDays: number,
  cycleMode: 'count' | 'weekday' | 'fixed_days',
  cyclesPerPeriod: number,
  cycleAnchorWeekday?: number | null,
  cycleFixedDays?: number | null,
  timezone: string = 'UTC'
): Date {
  const cutoff = computeCycleCutoff(
    periodStartIso,
    periodDurationDays,
    cycleMode,
    cyclesPerPeriod,
    cycleAnchorWeekday,
    cycleFixedDays,
    timezone
  );

  const start = new Date(periodStartIso);
  let cycleStart: Date;

  if (cycleMode === 'count') {
    const cycleDays = periodDurationDays / Math.max(cyclesPerPeriod || 1, 1);
    cycleStart = new Date(cutoff.getTime() - cycleDays * 24 * 60 * 60 * 1000);
  } else if (cycleMode === 'fixed_days') {
    const cycleDays = Math.max(cycleFixedDays || 1, 1);
    cycleStart = new Date(cutoff.getTime() - cycleDays * 24 * 60 * 60 * 1000);
  } else if (cycleMode === 'weekday') {
    // If it's a weekly anchor, the start is exactly 7 days before the cutoff
    cycleStart = new Date(cutoff.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else {
    cycleStart = start;
  }

  // Clamp to period start
  if (cycleStart < start) {
    return start;
  }

  return cycleStart;
}

/**
 * Returns the UTC Date that marks the start of the current point limit period.
 *
 * @param timezone IANA timezone string for the room. Used to calculate the
 *   correct "local midnight" for daily limits and to pass through to cycle
 *   calculations for cycle-based limits.
 */
export function computePointLimitStart(
  periodStartIso: string,
  pointLimitPeriod: 'day' | 'week' | 'month' | 'cycle' | null | undefined,
  periodDurationDays: number,
  cycleMode: 'count' | 'weekday' | 'fixed_days',
  cyclesPerPeriod: number,
  cycleAnchorWeekday?: number | null,
  cycleFixedDays?: number | null,
  timezone: string = 'UTC'
): Date {
  const now = new Date();
  const start = new Date(periodStartIso);
  const startMs = start.getTime();
  const nowMs = now.getTime();

  if (pointLimitPeriod === 'day') {
    // Use room midnight, not browser midnight, so the limit resets at the same
    // absolute instant for every member.
    return getLocalMidnight(now, timezone);
  }

  if (pointLimitPeriod === 'week') {
    const elapsedWeeks = Math.floor((Math.max(nowMs, startMs) - startMs) / (7 * 24 * 60 * 60 * 1000));
    return new Date(startMs + elapsedWeeks * 7 * 24 * 60 * 60 * 1000);
  }

  if (pointLimitPeriod === 'month') {
    const elapsedMonths = Math.floor((Math.max(nowMs, startMs) - startMs) / (30 * 24 * 60 * 60 * 1000));
    return new Date(startMs + elapsedMonths * 30 * 24 * 60 * 60 * 1000);
  }

  if (pointLimitPeriod === 'cycle') {
    return computeCycleStart(
      periodStartIso,
      periodDurationDays,
      cycleMode,
      cyclesPerPeriod,
      cycleAnchorWeekday,
      cycleFixedDays,
      timezone
    );
  }

  return getLocalMidnight(now, timezone);
}
