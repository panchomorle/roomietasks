/**
 * Format a season date range into a compact label.
 *
 * Rules:
 * - Same month:        "Apr/26"
 * - 2 months:          "Mar-Apr/26"
 * - 3+ months:         "Mar-Jun/26" (only extremes)
 *
 * If the period spans across years, the year of the end date is used.
 */

const MONTH_ABBR_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const MONTH_ABBR_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function formatSeasonLabel(
  periodStart: string,
  periodEnd: string,
  language: "en" | "es" = "en"
): string {
  const start = new Date(periodStart);
  const end = new Date(periodEnd);
  const months = language === "es" ? MONTH_ABBR_ES : MONTH_ABBR_EN;

  const startMonth = start.getUTCMonth();
  const endMonth = end.getUTCMonth();
  const endYear = end.getUTCFullYear().toString().slice(-2); // "26"

  if (startMonth === endMonth && start.getUTCFullYear() === end.getUTCFullYear()) {
    // Same month
    return `${months[startMonth]}/${endYear}`;
  }

  // Different months — show start-end
  return `${months[startMonth]}-${months[endMonth]}/${endYear}`;
}
