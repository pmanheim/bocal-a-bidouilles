## Problem Statement

Parents want to motivate their kids to build consistent daily habits (getting ready for school on time, practicing instruments, being kind to each other) in a way that is visual, fun, and collaborative. Currently, the family tracks progress on paper, which works but lacks the excitement, durability, and interactivity that would keep kids engaged over weeks-long goal periods. Kids also cannot easily see their cumulative progress or experience the satisfaction of earning rewards through sustained effort.

## Solution

**Bocal a Bidouilles** ("Jar of Trinkets") is a web app that lets families set up daily goals for their kids and track progress using a virtual marble jar. Each day the kids meet their goal, they earn a marble that drops into an illustrated jar with a satisfying animation. A calendar shows their streak with hand-drawn-style numbers and decorations. When the jar reaches the target count, the kids earn a pre-set prize with a big celebration.

The app runs on a shared tablet (e.g., iPad by the front door) and is designed for kids to interact with directly -- large touch targets, playful illustrations, fun sounds, and no typing required. Parents configure goals and can correct entries through a separate admin interface.

## User Stories

### Kid Interaction
1. As a kid, I want to tap my avatar on the main screen, so that the app knows it is me checking in.
2. As a kid, I want to see a visual checklist of everything I need to do (teeth, clothes, shoes, breakfast, bathroom), so that I can mentally confirm I am truly ready before checking in.
3. As a kid, I want to tap a big "I am Ready!" button when I have completed my tasks, so that I can log my success for the day.
4. As a kid, I want to see and hear a marble drop into the jar when I check in successfully, so that I feel an immediate reward.
5. As a kid, I want to see a big analog clock on the main screen when my goal has a time deadline, so that I know how much time I have left.
6. As a kid, I want to see my progress on the calendar with decorated numbers (hearts, stars, rainbows) for each success day, so that looking at the calendar feels fun and celebratory.
7. As a kid, I want each success day on the calendar to have different colored decorations, so that every day feels unique.
8. As a kid, I want to see a colored X on days I missed (not red -- something muted like purple or grey), so that misses are noted but do not feel overly punishing.
9. As a kid, I want to see the jar filling up with colorful marbles over time, so that I can visualize how close I am to earning my prize.
10. As a kid, I want to see the current marble count and target count clearly displayed, so that I always know exactly how close I am to my prize.
11. As a kid, I want to see what the prize is on the dashboard, so that I am reminded of what I am working toward.
12. As a kid, I want a big celebration when we reach the target (confetti, jar overflow, prize reveal, fun sounds), so that achieving the goal feels like a huge deal.
13. As a kid, I want to see the completed goal and full jar stay on screen after we finish, so that I can admire our accomplishment.
14. As a kid, I want to choose a fun avatar (dog, cat, alien, other creatures), so that the app feels personalized and fun.
15. As a kid, I want to be able to switch between different active goals on the dashboard, so that I can check in for different things.
16. As a kid, I want to see past completed goals and their full jars, so that I can look back on what we have achieved.

### Team Goal Dynamics
17. As a kid on a team goal, I want to see whether my sibling has already checked in today, so that I know if we are both on track.
18. As a kid on a team goal, I want the daily success celebration to only happen when both of us have checked in, so that we are motivated to help each other.
19. As a kid on a team goal, I want to understand that we succeed or fail together, so that I am motivated to help my sibling get ready too.

### Responsive Layout
20. As a user in landscape mode, I want to see the calendar on the left and the jar on the right side-by-side, so that I get the full view of progress.
21. As a user in portrait mode, I want to see just the jar with the current count and target prominently displayed, so that the most important info is visible on a narrower screen.

### Parent -- Daily Interaction
22. As a parent, I want to access admin controls without them being visible to the kids on the main screen, so that the kid-facing UI stays simple and uncluttered.
23. As a parent, I want to retroactively correct a daily entry (change a miss to a success or vice versa), so that I can fix technical glitches or edge cases.
24. As a parent, I want to mark a day as "skip" (holiday, sick day), so that it does not count for or against the kids' progress.
25. As a parent, I want to see the current status of all active goals at a glance, so that I know where things stand.

### Parent -- Goal Configuration
26. As a parent, I want to create a new goal with a name, description, target count, and prize, so that I can set up what the kids are working toward.
27. As a parent, I want to add visual checklist items (icons) to a goal, so that kids see reminders of what they need to do.
28. As a parent, I want to optionally set a daily deadline time for a goal, so that time-based goals are enforced automatically.
29. As a parent, I want to select which days of the week a goal is active (any combination of Sun-Sat), so that the goal only applies on relevant days.
30. As a parent, I want to select which kids participate in a goal, so that goals can apply to one or both children.
31. As a parent, I want to choose whether a goal is a team goal or individual, so that I can configure the right dynamic for the situation.
32. As a parent, I want to set a start date for a goal, so that tracking begins when I want it to.
33. As a parent, I want to easily restart a completed goal with a new target, prize, and start date, so that setting up the next round is quick.
34. As a parent, I want to archive completed goals, so that they are preserved in history but do not clutter the active view.
35. As a parent, I want to edit an active goal's configuration, so that I can adjust if something is not working.

### Parent -- Child Management
36. As a parent, I want to set up child profiles with a name and avatar, so that each kid has their identity in the app.
37. As a parent, I want to change a child's avatar, so that kids can switch if they want a new one.

### Cross-Cutting
38. As a user, I want the app to sync across devices in real-time, so that check-ins on the tablet are immediately visible on a parent's phone.
39. As a user, I want a mute option for sounds, so that early morning check-ins do not wake someone up.
40. As a user, I want the app to feel fast and responsive on tap, so that the morning rush is not slowed by loading screens.

## Implementation Decisions

### Tech Stack
- **Frontend**: Next.js (React) deployed on Vercel
- **Backend/Database**: Supabase (PostgreSQL + Realtime subscriptions)
- **Hosting**: Vercel (Phil has existing account)

### Database Schema (6 tables)
- **families**: Top-level grouping. One family for now, but the families table and family_id foreign keys throughout the schema ensure the architecture is ready for multi-family support and full authentication when needed in the future.
- **profiles**: Family members. Fields: name, avatar (avatar ID now, image URL later), role (child/parent). Belongs to a family.
- **goals**: Goal configuration. Fields: name, description, checklist items (JSON array of icon identifiers), target count, prize text, prize emoji/image, deadline time (nullable -- null means untimed goal), active days (bitmask or array of weekday numbers), team/individual flag, status (active/completed/archived), start date. Belongs to a family.
- **goal_participants**: Join table linking goals to child profiles.
- **daily_entries**: One row per goal per active day. Fields: goal ID, date, status (pending/success/miss/skip), success number (null if not a success -- otherwise the sequential count like 1, 2, 3...), decoration style (random seed for which decorations to show). Created automatically for each active day.
- **check_ins**: Individual check-in events. Fields: profile ID, goal ID, date, timestamp. Used to determine if a check-in was before the deadline and whether all team members have checked in.

### Multi-Tenancy and Auth Strategy
The v1 app has no authentication -- it is a single-family app with trust-based access. However, the architecture is designed so that authentication and multi-family support can be added later without restructuring:
- All tables reference a family_id, establishing tenant isolation at the data layer from day one
- Supabase Auth can be enabled later with Row Level Security (RLS) policies scoped to family_id
- The profile/role system (child vs parent) already separates permission levels conceptually
- This means the app could eventually support sharing with teachers, other families, or becoming a public product

### Module Architecture

1. **Database Layer / Business Logic**: Encapsulates all rules -- what counts as a success, is the goal complete, time validation, team completion logic. Simple interface: check in, get daily status, get goal progress. This is the deepest module.

2. **Goal Dashboard (Main Screen)**: Composed of sub-components -- Clock (only shown for time-based goals), Avatar Selector, Calendar Grid, Jar Visualization, Goal Selector, and count/target display. Responsive layout: landscape shows calendar + jar side-by-side; portrait shows jar only with current count and target prominently displayed.

3. **Check-in Flow**: The interaction sequence from avatar tap through success/failure feedback. Handles time validation and team completion detection.

4. **Animation and Sound Engine**: Marble drop, hand-drawn number animation, decoration randomization, X animation, goal completion celebration, mute toggle.

5. **Parent Admin Panel**: Goal CRUD, child profile management, daily entry correction, goal history. Accessed via gear icon -- hidden from kids' main flow.

6. **Real-time Sync**: Supabase Realtime subscriptions on check_ins and daily_entries tables so all devices reflect current state immediately.

### Key Design Decisions
- **No authentication (v1)**: Family app with trust-based access. Kids tap avatars, parents access admin via a gear/settings icon. Architecture supports adding auth later via Supabase Auth + RLS.
- **Avatar system**: Illustrated avatar picker with 8-12 options (must include dog, cat, mix of real animals and whimsical creatures). Data model stores avatar as a field that can later hold either an avatar ID or image URL to support future photo upload.
- **Time enforcement**: The app enforces deadline time in real-time. If a kid taps "I am Ready!" after the deadline, it counts as a miss. Parents can retroactively correct any entry. The clock component only appears on the dashboard for goals that have a deadline time configured.
- **Responsive layout**: In landscape orientation, the calendar grid sits on the left and the jar visualization on the right (matching the daughter's paper mockup). In portrait orientation, only the jar is shown with the current marble count and target count displayed prominently. In both orientations, the current count and target are clearly visible.
- **Calendar visual style**: Inspired by the daughter's hand-drawn paper mockup. Success days show a large hand-drawn-style number (sequential success count) with random decorations (hearts, stars, rainbows) in varying colors. Miss days show a muted colored X (not red). The calendar displays Mon-Fri across the top, weeks down the side.
- **Jar visual style**: 2D illustrated, storybook-like. Marbles are random colors from a cheerful palette. Matches the hand-drawn charm aesthetic.
- **Team goal logic**: For team goals, all participating kids must check in before the deadline for the day to count as a success. The daily success celebration (marble + decorated number) only triggers when the last team member checks in.
- **Daily entry lifecycle**: Each active day starts as "pending." It becomes "success" when all conditions are met, "miss" when the deadline passes without completion (or parent confirms), or "skip" when a parent marks it. Parents can change status at any time.

## Testing Decisions

### What makes a good test
Tests should verify external behavior through the module's public interface, not implementation details. If we refactor internals, tests should still pass. Tests should cover the rules that would be most painful to get wrong -- incorrect marble counts, wrong success/failure determinations, or broken goal completion logic would be very demotivating for the kids.

### Modules to test

1. **Database Layer / Business Logic** (unit tests):
   - Time-based success/failure determination (before deadline = success, after = miss)
   - Team completion logic (all members must check in for success)
   - Success counting (sequential numbering is correct)
   - Goal completion detection (target count reached)
   - Active day filtering (only configured days count)
   - Skip day handling (skipped days do not affect progress)
   - Daily entry state transitions (pending to success/miss/skip, parent overrides)

2. **Check-in Flow Logic** (unit tests):
   - Time validation against deadline
   - Duplicate check-in prevention (same kid, same goal, same day)
   - Team status calculation (who has/has not checked in)

3. **Goal Configuration** (integration tests):
   - Creating a goal produces correct database state
   - Editing a goal updates correctly
   - Restarting a goal creates new goal with correct defaults from previous
   - Archiving preserves history

### Modules NOT tested
- Animations and visual components (verified visually during development)
- Parent admin CRUD forms (standard form operations, low risk)
- Avatar picker UI (static selection, low risk)

## Out of Scope (V1)

- **Untimed goals** (behavioral / task-based daily yes/no) -- data model supports them, but no UI in v1
- **Individual goal mode** -- architecture supports it, but v1 focuses on team goals
- **Photo upload for avatars** -- avatar picker only in v1; data model accommodates future photo URLs
- **Date range configuration** -- no end-date for goals in v1; just start date + active days
- **Push notifications** -- no alerts when kids check in or miss
- **School calendar integration** -- holidays are handled manually via "skip day"
- **Authentication and multi-family support** -- architecture supports it (family_id, profiles with roles, Supabase Auth ready), but not implemented in v1
- **Offline support** -- requires internet connection
- **Native mobile app** -- web only, accessed via browser bookmark
- **Interactive checklist** -- checklist items are static visual reminders, not tappable checkboxes
- **Parental PIN/lock** -- admin is accessed via gear icon, no PIN protection in v1

## Further Notes

- **Ship fast**: The kids are currently tracking their "ready for school by 8:00 AM" goal on paper and have good momentum. The app should ship before that momentum fades. Prioritize a working v1 for the timed team goal over architectural perfection.
- **Daughter's design**: One of Phil's daughters drew a paper mockup of the UI (calendar on left, jar on right). The visual design should honor her sketch and maintain that hand-drawn, storybook charm. Phil may scan and attach the drawing for reference.
- **Physical context**: The tablet sits by the front door upstairs. Most morning tasks (teeth, clothes, breakfast) happen elsewhere in the house. This is why the checklist is view-only -- we do not want kids running back and forth to tap checkboxes. They complete everything, come to the tablet once, and check in.
- **Screen time as motivator**: The kids rarely get screen time, so interacting with the tablet app is itself exciting and motivating. The animations and sounds should lean into this -- make each interaction feel special.
- **Marble colors**: Each marble should be a random color from a cheerful palette. This adds visual variety to the jar without requiring any configuration.
- **Decoration randomization**: Each success day's calendar decorations (hearts, stars, rainbows, etc.) should be randomly selected and colored so no two days look the same.
- **Future public use**: While v1 is a single-family app, the architecture (families table, profile roles, Supabase Auth compatibility) is designed so the app could eventually be shared with teachers, other families, or made into a public product.
