/**
 * timezoneUtils.ts
 *
 * Centralized timezone utilities. All cycle boundary calculations should use
 * these helpers to stay in sync between the frontend and the database RPCs.
 *
 * Design principle:
 *  - Cycles are a ROOM-level concept. All members see the same absolute cutoff.
 *  - "Weekday" mode and "daily" point limits depend on what "midnight" means in
 *    the room's timezone (rooms.timezone), NOT the viewer's local timezone.
 *  - Push notifications use the individual user's timezone (profiles.timezone),
 *    which is a separate concern and is NOT handled here.
 */

/**
 * Returns the user's current browser timezone string (IANA format).
 * e.g. "America/Argentina/Buenos_Aires", "Europe/Madrid", "UTC"
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Returns a curated list of common IANA timezones formatted with their UTC offset.
 * e.g. { value: "America/New_York", label: "(UTC-04:00) America/New York" }
 */
export function getCuratedTimezones(): { value: string; label: string }[] {
  const commonTimezones = [
    "Pacific/Honolulu",
    "America/Anchorage",
    "America/Los_Angeles",
    "America/Denver",
    "America/Chicago",
    "America/New_York",
    "America/Toronto",
    "America/Vancouver",
    "America/Mexico_City",
    "America/Bogota",
    "America/Lima",
    "America/Santiago",
    "America/Buenos_Aires",
    "America/Sao_Paulo",
    "UTC",
    "Europe/London",
    "Europe/Madrid",
    "Europe/Paris",
    "Europe/Berlin",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Asia/Jerusalem",
    "Asia/Riyadh",
    "Asia/Dubai",
    "Asia/Kolkata",
    "Asia/Bangkok",
    "Asia/Shanghai",
    "Asia/Singapore",
    "Asia/Tokyo",
    "Asia/Seoul",
    "Australia/Perth",
    "Australia/Brisbane",
    "Australia/Sydney",
    "Pacific/Auckland",
  ];

  // Ensure the user's current timezone is always in the list
  const userTz = getUserTimezone();
  const timezonesToProcess = Array.from(new Set([...commonTimezones, userTz]));

  const result: { value: string; label: string; offsetMinutes: number }[] = [];
  const now = new Date();

  for (const tz of timezonesToProcess) {
    try {
      // Extract the long offset, e.g. "GMT-03:00" or "GMT"
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'longOffset',
      }).formatToParts(now);

      const offsetStr = parts.find((p) => p.type === 'timeZoneName')?.value || '';
      let formattedOffset = offsetStr.replace('GMT', 'UTC');
      if (formattedOffset === 'UTC') formattedOffset = 'UTC±00:00';

      // Parse offset to sort them logically
      let offsetMins = 0;
      const match = offsetStr.match(/GMT([+-])(\d{2}):(\d{2})/);
      if (match) {
        const sign = match[1] === '+' ? 1 : -1;
        offsetMins = sign * (parseInt(match[2]) * 60 + parseInt(match[3]));
      }

      result.push({
        value: tz,
        label: `(${formattedOffset}) ${tz.replace(/_/g, ' ')}`,
        offsetMinutes: offsetMins,
      });
    } catch (e) {
      // Ignore unsupported timezones
    }
  }

  // Sort by offset, then by name
  result.sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.label.localeCompare(b.label));

  return result.map(rest => ({ value: rest.value, label: rest.label }));
}

/**
 * Returns the day-of-week (0=Sun … 6=Sat) for a given Date as it would appear
 * in the specified IANA timezone.
 *
 * This is needed for weekday-mode cycle boundaries, where "Monday" must mean
 * Monday in the room's timezone for ALL members.
 */
export function getDayOfWeekInTimezone(date: Date, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).formatToParts(date);
  const weekdayStr = parts.find(p => p.type === 'weekday')?.value;
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  return map[weekdayStr ?? 'Sun'] ?? 0;
}

/**
 * Returns a UTC Date object that represents "local midnight" of the given Date
 * in the specified IANA timezone.
 *
 * Example: if date is 2026-04-13T21:09:00Z and tz is "America/Argentina/Buenos_Aires"
 * (UTC-3), then local time is 2026-04-13T18:09:00-03:00, so local midnight is
 * 2026-04-13T00:00:00-03:00, which in UTC is 2026-04-13T03:00:00Z.
 */
export function getLocalMidnight(date: Date, tz: string): Date {
  // Step 1: Find the local calendar date (YYYY-MM-DD) in the target timezone.
  const localDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date); // e.g. "2026-04-13"

  const [year, month, day] = localDateStr.split('-').map(Number);

  // Step 2: Probe at 12:00 UTC of that local date. Using noon guarantees we
  // stay within the same calendar day for any UTC offset (±14h max).
  const noonUTC = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  // Step 3: Check what local time it is at 12:00 UTC in the target timezone.
  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(noonUTC);

  const localHour = parseInt(timeParts.find(p => p.type === 'hour')!.value);
  const localMin  = parseInt(timeParts.find(p => p.type === 'minute')!.value);

  // Step 4: Compute the UTC offset in minutes.
  // At noonUTC, localHour:localMin is what the clock shows in that TZ.
  // UTC offset (minutes) = (localTime - UTCTime) = (localHour - 12) * 60 + localMin
  // Examples:
  //   UTC-3  → localHour=09 → offset = (9-12)*60 = -180
  //   UTC+2  → localHour=14 → offset = (14-12)*60 = +120
  const offsetMinutes = (localHour - 12) * 60 + localMin;

  // Step 5: Midnight in UTC = midnight of the local date shifted by -offset.
  // UTC = localTime − offset → midnight UTC = 00:00 local − offset = −offset from midnight UTC
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000);
}

