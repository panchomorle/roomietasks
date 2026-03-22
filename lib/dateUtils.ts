import { differenceInCalendarDays, format } from 'date-fns';
import { enUS, es } from 'date-fns/locale';

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

/** Returns the UTC midnight Date that marks the end of the current cycle. */
export function computeCycleCutoff(
  periodStartIso: string,
  periodDurationDays: number,
  cycleMode: 'count' | 'weekday' | 'fixed_days',
  cyclesPerPeriod: number,
  cycleAnchorWeekday?: number | null,
  cycleFixedDays?: number | null
): Date {
  const start = new Date(periodStartIso);
  const now = new Date();
  const periodEnd = new Date(start.getTime() + periodDurationDays * 24 * 60 * 60 * 1000);

  let cutoff: Date;

  if (cycleMode === 'count') {
    const cycleDays = periodDurationDays / Math.max(cyclesPerPeriod || 1, 1);
    const startMs = start.getTime();
    const nowMs = now.getTime();
    
    // Find how many cycles have passed
    // If now is before start, passedCycles will be negative
    const passedCycles = Math.floor((Math.max(nowMs, startMs) - startMs) / (cycleDays * 24 * 60 * 60 * 1000));
    cutoff = new Date(startMs + (passedCycles + 1) * cycleDays * 24 * 60 * 60 * 1000);
  } else if (cycleMode === 'fixed_days') {
    const cycleDays = Math.max(cycleFixedDays || 1, 1);
    const startMs = start.getTime();
    const nowMs = now.getTime();
    
    const passedCycles = Math.floor((Math.max(nowMs, startMs) - startMs) / (cycleDays * 24 * 60 * 60 * 1000));
    cutoff = new Date(startMs + (passedCycles + 1) * cycleDays * 24 * 60 * 60 * 1000);
  } else if (cycleMode === 'weekday') {
    // Start from today, find the next occurrence of cycleAnchorWeekday.
    // If today is the anchor day, advance to next week.
    const anchorDay = cycleAnchorWeekday || 0; // 0=Sun
    const nowMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentDay = nowMidnight.getDay(); // 0=Sun
    
    let diff = anchorDay - currentDay;
    if (diff <= 0) {
      diff += 7; // So if today is the anchor day (diff=0), it becomes 7
    }
    
    cutoff = new Date(nowMidnight.getTime() + diff * 24 * 60 * 60 * 1000);
  } else {
    // fallback
    cutoff = periodEnd;
  }

  // Clamp cutoff to periodEnd if it exceeds it
  if (cutoff > periodEnd) {
    return periodEnd;
  }
  // Ensure it's not before period start
  if (cutoff < start) {
    return start;
  }
  
  return cutoff;
}

/** Returns the UTC midnight Date that marks the start of the current cycle. */
export function computeCycleStart(
  periodStartIso: string,
  periodDurationDays: number,
  cycleMode: 'count' | 'weekday' | 'fixed_days',
  cyclesPerPeriod: number,
  cycleAnchorWeekday?: number | null,
  cycleFixedDays?: number | null
): Date {
  const cutoff = computeCycleCutoff(
    periodStartIso,
    periodDurationDays,
    cycleMode,
    cyclesPerPeriod,
    cycleAnchorWeekday,
    cycleFixedDays
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
