# RoomieTasks Architecture

## Tech Stack
- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: 
  - Server State: React Query (`@tanstack/react-query`)
  - Client State: Jotai (for things like filters, sorting, active room ID)
- **Database / Backend**: Supabase (PostgreSQL, Authentication)

## Key Architectural Patterns

### 1. Data Fetching and Mutations
- The app heavily utilizes **React Query** for fetching, caching, and invalidating data. 
- Custom hooks (e.g., `useTasks.ts`, `useTaskMutations.ts`) wrap the Supabase client and React Query, exposing clean APIs to UI components.
- Stale time is configured globally to 60 seconds to avoid unnecessary refetches.

### 2. State Management Strategy
- **React Query** handles all asynchronous data coming from Supabase (Tasks, Rooms, Leaderboard).
- **Jotai** atoms are used sparingly for purely client-side global state, such as active `taskFilter`, `taskSort`, and the currently viewed `currentRoomIdAtom`.

### 3. Database Schema Overview
- **`profiles`**: User information tied to Supabase Auth.
- **`rooms`**: Main container for groups. Defines `contribution_per_member`, `period_duration_days`, etc.
- **`room_members`**: Join table mapping users to rooms with roles (e.g., admin, member).
- **`task_templates`**: Defines the blueprint for recurring tasks (e.g., patterns, points reward).
- **`task_instances`**: Individual, actionable manifestations of a task that users claim and complete.
- **`period_history` / `period_user_history`**: Snapshots of past seasons/periods and the results/points distributed.

### 4. Heavy Lifting via Supabase RPCs
- Complex, transactional logic is offloaded to the database via stored procedures (RPCs) to ensure data integrity and prevent race conditions.
- Notable RPCs:
  - `generate_task_instances`: Creates actionable task instances based on `task_templates` recurrence rules.
  - `claim_task_instance`: Safely assigns a task to a user, checking point limits and applying cool-downs.
  - `complete_task_instance`: Validates and marks tasks as completed.
  - `end_period`: Finalizes the current season, distributes data into history tables, and resets the board.

## File Structure Organization
- `/app`: Next.js App Router pages and layouts (`/dashboard`, `/room`, etc.).
- `/components`: Reusable UI components (`DraggableDrawer`, `SeasonManager`, modals).
- `/hooks`: Custom React Query hooks (`/queries`, `/mutations`).
- `/lib`: Helper logic, configurations, translation maps, and the Supabase client setup.
- `/store`: Jotai atoms.
- `/types`: Contains TypeScript types, critically including the generated `database.ts` from Supabase.
