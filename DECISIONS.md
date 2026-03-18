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
