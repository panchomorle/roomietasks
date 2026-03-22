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
**Decision**: Replaced generic `window.confirm()` calls with beautifully designed UI Modals (e.g., `EndSeasonModal`, `PointLimitModal`).
**Reasoning**: 
- Elevates the visual quality to a premium aesthetic (glassmorphism/Tailwind components).
- Allows the injection of detailed context before a permanent action (e.g., showing exact point breakdowns and tasks completed before ending the season).

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
