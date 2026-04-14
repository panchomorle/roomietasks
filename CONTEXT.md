# RoomieTasks Context

## Product Overview
**RoomieTasks** is a web application designed to help roommates or cohabitants manage household chores fairly and transparently. It gamifies the experience by turning tasks into a competitive, point-based system.

## Core Loop
1. **Rooms**: Users join or create "Rooms" (representing a household). 
2. **Tasks**: Tasks are created (either one-time or recurring via templates) and assigned point values.
3. **Claiming & Completing**: Room members claim tasks and complete them to earn points.
4. **Seasons**: A room operates on defined seasons (e.g., 30 days).
5. **The Pot & Leaderboard**: Members contribute to a prize pool ("The Pot"). At the end of the season, members are ranked on a leaderboard based on points earned. The pot is distributed proportionally or definitively to the top performers, depending on room settings.
6. **Cycles**: Within a season, rooms can enable "Cycles" to break the time into smaller rounds (e.g., weekly cycles within a monthly season). This resets task availability more frequently.

## Key Terminology
- **Task Template**: The definition of a chore (e.g., "Clean the kitchen"). Stores recurrence data, point rewards (including fractional values like 0.5), etc.
- **Task Instance**: A specific occurrence of a chore that needs to be done *today* or by a certain *due date*.
- **Season**: The active timeframe in which points are accumulated.
- **Cycle**: A sub-period within a season (optional). Cycles can be configured by a fixed count, a specific weekday anchor, or a fixed number of days.
- **Podium**: The top 3 users at the end of a season.
- **Point Limit**: A mechanism to prevent a single user from hoarding all easy tasks by capping the points one can claim in a specific timeframe (Daily, Weekly, Monthly, or per Cycle).

## Recent Focus & Features
- **Task Editing**: Full editing of task templates, recalculating and regenerating instances based on whether they start "today" or in the next cycle.
- **Flexible Cycles**: Implementation of three cycle modes (Count, Anchor Day, Fixed Length) with a live countdown timer on the dashboard.
- **Customizable Season Start**: Ability for admins to set the exact start date of the season, with future-dating support.
- **Contextual Help**: A global tooltip system (Info buttons) explaining technical house rules (Seasons, Cycles, Cooldowns) to users.
- **Fairness Mechanisms**: "Claim Warnings" if users exceed point limits (now including Cycle-based limits), and custom "Cooldown" periods for repeating tasks.
- **UX Improvements**: Dedicated `Rooms` management page, simplified dashboard countdowns, and refined internal alignment for mobile/drawer tooltips.
- **Localization**: Full translation support (English/Spanish) for all new UI strings and technical terms.
- **End Season Summary**: A detailed end-of-season modal showing exact task completion counts alongside points to ensure transparency before the season is finalized and historical data is logged.
- **Timezone Synchronization**: Accurate cycle countdowns and boundary resets that respect the room's explicitly configured timezone, preventing server UTC drift. Allows international members to align "midnight" universally.
- **Scheduled Push Notifications**: Server-side `pg_cron` jobs that dispatch localized, time-aware push notifications (daily reminders and cycle-end warnings) directly to user devices.
