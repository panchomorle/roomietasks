# RoomieTasks Context

## Product Overview
**RoomieTasks** is a web application designed to help roommates or cohabitants manage household chores fairly and transparently. It gamifies the experience by turning tasks into a competitive, point-based system.

## Core Loop
1. **Rooms**: Users join or create "Rooms" (representing a household). 
2. **Tasks**: Tasks are created (either one-time or recurring via templates) and assigned point values.
3. **Claiming & Completing**: Room members claim tasks and complete them to earn points.
4. **Seasons / Periods**: A room operates on defined periods (e.g., weekly or monthly).
5. **The Pot & Leaderboard**: Members contribute to a prize pool ("The Pot"). At the end of the period, members are ranked on a leaderboard based on points earned. The pot is distributed proportionally or definitively to the top performers, depending on room settings.

## Key Terminology
- **Task Template**: The definition of a chore (e.g., "Clean the kitchen"). Stores recurrence data, point rewards (including fractional values like 0.5), etc.
- **Task Instance**: A specific occurrence of a chore that needs to be done *today* or by a certain *due date*.
- **Season / Period**: The active timeframe in which points are accumulated.
- **Podium**: The top 3 users at the end of a season.
- **Point Limit**: A mechanism to prevent a single user from hoarding all easy tasks by capping the points one can claim in a specific timeframe.

## Recent Focus & Features
- **Task Editing**: Full editing of task templates, recalculating and regenerating instances based on whether they start "today" or in the next cycle.
- **Fairness Mechanisms**: "Claim Warnings" if users exceed point limits, and custom "Cooldown" periods for repeating tasks to prevent immediate re-claiming by the same person.
- **UX Improvements**: Dedicated `Rooms` management page, robust empty-state handling (guiding users to create/join rooms if they have none).
- **Localization**: Full translation support (English/Spanish) for dynamic components like recurrence options.
- **End Season Summary**: A detailed end-of-period modal showing exact task completion counts alongside points to ensure transparency before the season is finalized and historical data is logged.
