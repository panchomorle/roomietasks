# Architectural & Product Decisions

This document tracks significant design choices made during the development of RoomieTasks.

## 1. Database-side Business Logic (Supabase RPCs)
**Decision**: Complex operations like claiming tasks, ending periods, and generating future recurring tasks are implemented entirely inside PostgreSQL functions (RPCs) rather than in the Next.js API or client application.
**Reasoning**: 
- Prevents race conditions (e.g., two roommates trying to claim the exact same task simultaneously).
- Ensures data integrity (the logic runs within database transactions).
- Avoids complex state synchronization issues between client devices.

## 2. Separation of State Management (Jotai + React Query)
**Decision**: The app does not rely on a monolithic state manager like Redux. Instead, it uses **React Query** strictly for server state and data caching, and **Jotai** for transient, UI-only local state.
**Reasoning**: 
- React Query handles caching, invalidation, and background fetching optimally.
- Jotai's atomic design allows for minimal boilerplate when sharing simple UI states (like active filters, sorting preferences, and the current room context) between deeply nested components.

## 3. Template vs. Instance Model for Tasks
**Decision**: Tasks are split into two tables: `task_templates` and `task_instances`. 
**Reasoning**: 
- Allows for powerful recurrence logic. Modifying a `task_template` automatically regenerates pending `task_instances` without affecting historical, already-completed tasks.
- Solves issues where editing a recurring task's points previously resulted in historical leaderboard inaccuracies. 

## 4. Dedicated Rooms Page
**Decision**: Transitioned from managing room joining/creation entirely through disjointed routes or complex dashboard modals into a dedicated `/dashboard/rooms` page.
**Reasoning**: 
- Solved empty-state infinite loading bugs.
- Provides a clean hub for users who manage multiple households/groups.
- Simplified navigation context, allowing the main App Shell to cleanly disable `Tasks`, `Leaderboard`, and `History` tabs if no active room is selected.

## 5. UI Modals for Destructive/Final Actions
**Decision**: Replaced generic `window.confirm()` and `alert()` calls with beautifully designed UI Modals located in the dedicated `/components/modals/` directory.
**Reasoning**: 
- Elevates the visual quality to a premium aesthetic (glassmorphism/Tailwind components).
- Centralizes scattered modal files into a single, cohesive folder structure.
- Allows the injection of detailed context before a permanent action (e.g., showing exact point breakdowns and tasks completed before ending the season).

**Implemented Modals**:
- `PointLimitModal.tsx`: The primary decision engine for business logic errors during task claiming and completion (handles point limits, cooldowns, claim limits, and future cycle restrictions).
- `EndSeasonModal.tsx`: Advanced confirmation modal displaying the podium, prize pool, and point shares before permanently finalizing a season.
- `NotificationPromptModal.tsx`: Beautifully designed bottom-sheet style prompt prompting users to opt-in to Push Notifications.
- `DeleteTaskModal.tsx`: Branded red destructive confirmation modal replacing `window.confirm()` (reusable via override props for kicking members).
- `GenericErrorModal.tsx`: Catch-all fallback modal for unexpected errors, replacing generic `alert()` calls.

**`PointLimitModal` – Critical Implementation Note**:
The `PointLimitModal` handles errors from **two separate RPCs** (`claim_task_instance` and `complete_task_instance`), both of which can return `point_limit_exceeded` as a JSONB payload (`{ success: false, error: "point_limit_exceeded", ... }`). The `action` prop (`"claim"` | `"complete"`) **must always be passed** and must match the operation that triggered the error:
- `action="claim"` → the "force" button calls `claimAnyway` (re-invokes claim with `p_force: true`).
- `action="complete"` → the "force" button calls `completeAnyway` (re-invokes complete with `p_force: true`).

**Error Flow & Normalization — How to Avoid Breaking RPC Handling**:
Both RPCs return JSONB. Business-logic errors come back as `{ data: { success: false, error: "<code>", ... }, error: null }`. The mutation hooks in `hooks/mutations/useTaskMutations.ts` convert `data.error` into a thrown `Error` with `err.code = data.error` and `err.details = data`. 

> [!WARNING]
> **RPC Code Mismatches**: The frontend React components (`handleClaim` / `handleComplete`) must explicitly check `err.code` to trigger specific Modals (like `PointLimitModal`). If an agent or developer changes an RPC to return `"future_cycle"` but the UI expects `"claim_not_current_cycle"`, the error **will fall through** the conditional logic and trigger the `GenericErrorModal` (or previously, a raw `alert(err.code)`). 
> **How to avoid this**: When returning custom string IDs from Supabase RPCs, you MUST either ensure identical 1:1 mapping in the frontend catch blocks, or manually normalize the alias in the catch block (e.g., `if (err.code === "future_cycle") err.code = "claim_not_current_cycle";`) *before* passing it to the UI modal logic. Exhaustive error handling is required.

## 6. Fractional Points Support
**Decision**: Switched from implicit integer point handling in Supabase RPCs to explicit `numeric` types for all point-related calculations.
**Reasoning**: 
- Users requested the ability to assign rewards like `0.5` points.
- Previous `integer` variable declarations in PL/pgSQL caused automatic rounding (e.g., `0.5` became `1`), leading to leaderboard inaccuracies.
- Using `numeric` throughout the database layer (RPC variables and table columns) ensures perfect precision for any decimal point value.

## 7. Multi-mode Flexible Cycles
**Decision**: Introduced an optional but robust cycle system with three modes: `count` (fixed chunks), `weekday` (e.g., every Monday), and `fixed_days` (e.g., every 10 days).
**Reasoning**: 
- Users have different household routines (some sync with trash day, others with rent).
- Making cycles optional (via a toggle) reduces complexity for users who only want to track simple monthly seasons.
- The `get_current_cycle_start` RPC ensures that point limits are enforced accurately across these dynamic boundaries.

## 8. Migration to "Season" Terminology
**Decision**: Standardized all user-facing strings and internal documentation from "Period" to "Season".
**Reasoning**: 
- "Period" was too clinical and often confused with "Cycles".
- "Season" implies a beginning, an end, and a leaderboard reset, which better matches the gamified nature of the pot distribution.

## 9. Contextual "Info" Tooltip System
**Decision**: Added small info buttons (i) next to every configuration field in the Room Settings.
**Reasoning**: 
- As more fairness mechanisms (Cooldowns, Point Limits, Cycles) were added, the cognitive load for new admins increased.
- Inline explanations prevent users from having to search for a manual or guess how a setting affects the room logic.
- Implemented edge-aware alignment (Left/Right) to prevent layout overflow on mobile/drawer screens.

## 10. Web Push Notifications via PWA & Edge Functions
**Decision**: Implemented native Web Push notifications leveraging `@serwist/next` for the Service Worker, Supabase Edge Functions for dispatch (`notify-task-completed`, `send-push`), and Database Webhooks for triggers.
**Reasoning**:
- **Cross-Platform**: By requiring PWA installation (Add to Home Screen), Web Push works natively on both Android and iOS (iOS 16.4+).
- **Security & UX**: The VAPID private key is stored exclusively as a Supabase Secret and never exposed to the client. The UI cleanly handles permission states (`granted`, `denied`, `unsupported`).
- **Decoupled Architecture**: 
  - `task_instances` table simply fires a PostgreSQL trigger on `UPDATE ... "completed"`.
  - Webhook edge function (`notify-task-completed`) fetches all *other* room members and invoked `send-push` in a loop.
  - `send-push` uses the `web-push` library to encrypt the payload and dispatch it to the browser's push service. It also automatically scrubs expired subscriptions (`404` or `410` status from the push endpoint). 
**Key Rotation**: To rotate VAPID keys, generate a new pair (`npx web-push generate-vapid-keys`), update `.env.local` for the client, and update the Supabase project secrets (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). Existing subscriptions will require users to re-subscribe.

## 11. Room-Level Timezone Authority
**Decision**: Assigned a `timezone` column to `rooms` (defaulting to the admin's local timezone on creation) to dictate global reset boundaries, while keeping `timezone` on individual `profiles`.
**Reasoning**: 
- **Fairness**: A room limit/cycle MUST reset at the exact same physical moment for all members. If two roommates travel to different timezones, "midnight" should process concurrently so no one can "game" the point limits by changing their local OS clock.
- **Personalization**: `profiles.timezone` is retained so that scheduled web push notifications (like daily morning reminders) can be delivered relative to the user's *actual* physical location. 

## 12. Automated Type Synchronization
**Decision**: Required the use of `npm run generate:types` utilizing the Supabase CLI (`supabase gen types typescript`).
**Reasoning**:
- Hand-writing interfaces for complicated RPC returns and schemas invites subtle client-side crashes if the DB API diverges from frontend expectations.
- Running this command acts as the source of truth bridge whenever structural database changes (tables, columns, or RPC functions) occur.
