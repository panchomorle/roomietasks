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
