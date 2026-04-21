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
- **`rooms`**: Main container for groups. Defines `contribution_per_member`, `period_duration_days`, `current_period_start_date`, and cycle configuration (`cycle_mode`, `cycle_anchor_weekday`, `cycle_fixed_days`).
- **`room_members`**: Join table mapping users to rooms with roles (e.g., admin, member).
- **`task_templates`**: Defines the blueprint for recurring tasks (e.g., patterns, points reward).
- **`task_instances`**: Individual, actionable manifestations of a task that users claim and complete.
- **`period_history` / `period_user_history`**: Snapshots of past seasons/periods and the results/points distributed.

### 4. Heavy Lifting via Supabase RPCs / Database Functions
- Complex, transactional logic is offloaded to the database via stored procedures (RPCs) to ensure data integrity and prevent race conditions.
- **Available Functions (`public` schema):**
  - \`claim_task_instance(p_task_id uuid, p_user_id uuid, p_force boolean DEFAULT false) -> jsonb\`: Safely assigns a task to a user, checking point limits and applying cool-downs.
  - \`complete_task_instance(p_task_id uuid, p_user_id uuid, p_force boolean DEFAULT false) -> jsonb\`: Validates and marks tasks as completed.
  - \`end_period(p_room_id uuid) -> uuid\`: Finalizes the current season, distributes data into history tables, and resets the board.
  - \`generate_invite_code() -> trigger\`: Automatically generates short invite codes for rooms on creation.
  - \`generate_task_instances(p_template_id uuid, p_start_date timestamp with time zone DEFAULT now(), p_count integer DEFAULT 4) -> void\`: Creates actionable task instances based on \`task_templates\` recurrence rules.
  - \`get_current_cycle_start(p_room_id uuid, p_timezone text DEFAULT 'UTC'::text) -> timestamp with time zone\`: Calculates the start of the currently active cycle based on the room's \`cycle_mode\` configuration. Used to enforce point limits.
  - \`get_user_point_status(p_room_id uuid, p_user_id uuid) -> jsonb\`: Summarizes a user's current point status, earnings, and limits for the cycle.
  - \`handle_new_user() -> trigger\`: Automatically creates profile entries upon Supabase Auth user signup.
  - \`handle_task_completion() -> trigger\`: Hook used to trigger related updates upon task completion. 
  - `is_room_admin(p_room_id uuid) -> boolean`: Security definer logic; checks if the calling user has the admin role in a given room.
  - `is_room_member(p_room_id uuid) -> boolean`: Security definer logic; checks if the calling user is a member of a given room.
  - `rls_auto_enable() -> event_trigger`: Utility for automatically ensuring RLS stays enabled on new tables.
  - `unclaim_task_instance(p_task_id uuid) -> jsonb`: Restores a declined task's reward to its original template value, preventing degraded points caused by previous limit checks.
  - `webhook_notify_task_completed() -> trigger`: Dispatches notifications to Edge Functions/services when a task is finished.

### 5. Type Safety & Database Synchronization
- The application relies on Supabase's auto-generated types to ensure strict typing across RPCs and queries.
- **Workflow Requirement**: Whenever a change is made to the database schema (adding tables, altering columns, modifying RPC signatures), developers must execute `npm run generate:types`. This executes the Supabase CLI to introspect the remote database and rewrite the definitions automatically, guaranteeing frontend sync.

> [!IMPORTANT]
> **Point Type Precision**: Always use \`numeric\` (PostgreSQL) or \`number\` (TypeScript) for point calculations. Avoid \`integer\` variables in RPCs, as they will round fractional rewards (like 0.5) to the nearest whole number.

## File Structure Organization
- `/app`: Next.js App Router pages and layouts (`/dashboard`, `/room`, etc.).
- `/components`: Reusable UI components (`DraggableDrawer`, `SeasonManager`) and the dedicated `/components/modals/` directory for all app modals.
- `/hooks`: Custom React Query hooks (`/queries`, `/mutations`) and utility hooks like `useCycleCountdown.ts`.
- `/lib`: Helper logic, configurations, translation maps, date utilities (handling complex cycle calculations), and the Supabase client setup.
- `/store`: Jotai atoms.
- `/types`: Contains TypeScript types, critically including the generated `database.ts` from Supabase.
