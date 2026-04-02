/**
 * Notification strings shared between the frontend (via translations.ts)
 * and Supabase Edge Functions.
 *
 * Rules:
 *  - No framework imports — pure JS/TS only so Deno edge functions can consume this.
 *  - Body strings use {placeholder} syntax. Call fillTemplate() to resolve them.
 *  - Add a new language by adding a key that satisfies the NotificationStrings shape.
 */

/** Shape every language entry must satisfy. */
export interface NotificationStrings {
  notif_task_completed_title: string;
  notif_task_completed_body: string;
  notif_cycle_warning_day_title: string;
  notif_cycle_warning_day_body: string;
  notif_cycle_warning_hour_title: string;
  notif_cycle_warning_hour_body: string;
  notif_cycle_ended_title: string;
  notif_cycle_ended_body: string;
  notif_daily_no_claims_title: string;
  notif_daily_no_claims_body: string;
  notif_daily_claim_more_title: string;
  notif_daily_claim_more_body: string;
}

export const notificationStrings: Record<string, NotificationStrings> = {
  en: {
    // Task completed (webhook-triggered)
    notif_task_completed_title: "Task Completed! 🎉",
    notif_task_completed_body: '{user} completed "{task}" in {room} (+{points} pts)',

    // Cycle notifications (scheduled)
    notif_cycle_warning_day_title: "📅 Cycle Ending Tomorrow!",
    notif_cycle_warning_day_body:
      "The cycle in {room} ends in {time}. Claim and complete your tasks before it's over!",
    notif_cycle_warning_hour_title: "⏰ Cycle Ending Soon!",
    notif_cycle_warning_hour_body:
      "The cycle in {room} ends in {time}. Last chance to finish your tasks!",
    notif_cycle_ended_title: "🔄 Cycle Ended!",
    notif_cycle_ended_body:
      "The cycle in {room} has just ended. You can now claim tasks for the new cycle!",

    // Daily reminder (scheduled)
    notif_daily_no_claims_title: "📋 Don't Miss Out!",
    notif_daily_no_claims_body:
      "You haven't claimed any tasks in {room} this cycle. Don't miss out or you'll lose money!",
    notif_daily_claim_more_title: "💪 Keep Going!",
    notif_daily_claim_more_body:
      "Nice work in {room}! But the cycle isn't over — claim more tasks before it ends!",
  },
  es: {
    // Task completed (webhook-triggered)
    notif_task_completed_title: "¡Tarea completada! 🎉",
    notif_task_completed_body: '{user} completó "{task}" en {room} (+{points} pts)',

    // Cycle notifications (scheduled)
    notif_cycle_warning_day_title: "📅 ¡El ciclo termina mañana!",
    notif_cycle_warning_day_body:
      "El ciclo en {room} termina en {time}. ¡Reclamá y completá tus tareas antes de que termine!",
    notif_cycle_warning_hour_title: "⏰ ¡El ciclo está por terminar!",
    notif_cycle_warning_hour_body:
      "El ciclo en {room} termina en {time}. ¡Última oportunidad para terminar tus tareas!",
    notif_cycle_ended_title: "🔄 ¡Ciclo finalizado!",
    notif_cycle_ended_body:
      "El ciclo en {room} acaba de terminar. ¡Ya podés reclamar tareas para el nuevo ciclo!",

    // Daily reminder (scheduled)
    notif_daily_no_claims_title: "📋 ¡No te quedes afuera!",
    notif_daily_no_claims_body:
      "No reclamaste ninguna tarea en {room} este ciclo. ¡No te lo pierdas o perderás dinero!",
    notif_daily_claim_more_title: "💪 ¡Seguí así!",
    notif_daily_claim_more_body:
      "¡Buen trabajo en {room}! Pero el ciclo no terminó — ¡reclamá más tareas antes de que termine!",
  },
};

/** Default language used when a user's preference is missing or unrecognized. */
export const DEFAULT_NOTIFICATION_LANG = "en";

/**
 * Returns the notification strings for the given language, falling back to
 * English if the language is not supported.
 */
export function getNotificationStrings(lang: string): NotificationStrings {
  return notificationStrings[lang] ?? notificationStrings[DEFAULT_NOTIFICATION_LANG];
}

/**
 * Replaces {placeholder} tokens in a template string with values from `vars`.
 * Unknown placeholders are left as-is.
 *
 * @example
 *   fillTemplate("Hello {name}!", { name: "Alice" }) // "Hello Alice!"
 */
export function fillTemplate(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`);
}
