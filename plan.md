## Plan: End Season Modal Enhancement

This plan enhances the `EndSeasonModal` to display a comprehensive season summary (podium, point/task totals, and prize distribution) and standardizes its usage replacing native browser prompts.

**Steps**
1. **Enhance Task Tracking**
   - Update `useLeaderboard` to compute and return `tasksCompleted` by incrementing a counter alongside points.
2. **Upgrade EndSeasonModal Component**
   - Update props to include `roomId`, `room`, `isOpen`, `onClose`, and an optional `onConfirm`.
   - Integrate `useLeaderboard` and `useRoomMembers` to fetch real-time season data.
   - Calculate the total prize pool (`contribution_per_member` * total members), total points, and total tasks.
   - Design a **Podium UI** for the top 3 users.
   - Display a list of all participants showing their points, tasks completed, and percentage share of the total prize pool.
3. **Integrate with Manual "End Period" Button**
   - In `app/dashboard/leaderboard/page.tsx`, remove the `window.confirm` logic.
   - Introduce local state to manage the modal visibility.
   - Render the `EndSeasonModal`, passing the necessary props and binding the `onConfirm` exact to the existing `endPeriod.mutate({ roomId })` function.
4. **Fix SeasonManager Automatic Trigger Component**
   - Fix the current prop mismatch where `SeasonManager` incorrectly passes only `room` and `onClose`.
   - Import `useEndPeriod` mutation and trigger it via the modal's `onConfirm` prop.

**Relevant files**
- `hooks/queries/useTasks.ts` — Add task counting (`tasksCompleted`) logic to the `useLeaderboard` reduction map.
- `components/EndSeasonModal.tsx` — Complete UI overhaul to include data fetching logic, podium rendering, dividend calculations, and fix prop interface.
- `app/dashboard/leaderboard/page.tsx` — Swap `window.confirm` for modal state management and pass in newly required props.
- `components/SeasonManager.tsx` — Fix props passed to `EndSeasonModal` to match the new definition (`isOpen`, `roomId`, `room`, `onConfirm`).

**Verification**
1. Click the "End Current Period" button on the Leaderboard page as an admin: the new modal should appear showing precise calculations before finalization.
2. The modal layout should clearly indicate the top 3 (podium), overall totals, and standard prize distributions among remaining players.
3. Time expiration logic via `SeasonManager` should correctly pop open the same modal utilizing the exact same detailed UI summary.

**Decisions**
- Distribute money proportionately based on the percentage of points earned against total points (matching current logic implicit in the UI).
- Delegate all exact point aggregation and member count to `schema` and hooks dynamically within the modal wrapper, minimizing prop bloat.
