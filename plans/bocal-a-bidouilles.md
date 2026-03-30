# Plan: Bocal a Bidouilles

> Source PRD: PRDs/001-bocal-a-bidouilles.md

## Architectural decisions

Durable decisions that apply across all phases:

- **Stack**: Next.js (App Router) deployed on Vercel, Supabase (PostgreSQL + Realtime) for backend
- **Routes**:
  - `/` — Main dashboard (kid-facing)
  - `/admin` — Parent settings panel (tabbed: Goals, Kids, History, Edit Entries)
- **Schema** (6 tables, all scoped to `family_id`):
  - `families` — top-level tenant grouping
  - `profiles` — family members (name, avatar, role: child/parent, color)
  - `goals` — goal configuration (name, description, checklist JSON, target count, prize, deadline time, active days, team/individual flag, status, start date)
  - `goal_participants` — join table linking goals to child profiles
  - `daily_entries` — one row per goal per active day (status: pending/success/miss/skip, success number, decoration seed)
  - `check_ins` — individual check-in events (profile ID, goal ID, date, timestamp)
- **Auth**: None in v1. Single family, trust-based access. Architecture supports future Supabase Auth + RLS via `family_id` scoping.
- **Design tokens**: Semantic CSS custom properties for colors (`--color-primary: #158068`), spacing (4-64px scale), typography (16px min body, 14px min labels), border radius. See PRD Design Tokens section.
- **Icon library**: Lucide icons throughout. Custom SVGs following Lucide conventions for gaps.
- **Accessibility**: All touch targets 44x44px minimum. All animations gated behind `prefers-reduced-motion`. WCAG AA contrast ratios.

---

## Phase 1: Scaffold + Read-Only Dashboard

**User stories**: #5, #6, #8, #9, #10, #11, #20, #39

> **Goal**: Prove the stack works end-to-end. A deployed app that reads from Supabase and renders the main dashboard with real data. No interactivity beyond viewing.

### What to build

Set up the Next.js project with Supabase client, deploy pipeline to Vercel, and design token CSS variables. Create all 6 database tables in Supabase with proper foreign keys and RLS policies (permissive for now — no auth). Write a seed script that creates one family, two child profiles (Lily + Emma with avatars and colors), one "Ready for School!" goal (target: 20, deadline: 8:00 AM, weekdays only, team mode), and ~2 weeks of sample daily entries (mix of successes, misses, and pending days).

Render the main dashboard in landscape layout:
- **Top bar**: Goal name, prize pill, marble count/target, mute icon, settings/gear icon
- **Calendar grid**: 7-day grid (Mon-Sun), greyed-out SAT/SUN columns, success days with large hand-drawn-style number and random decorations, miss days with muted X, "TODAY" marker on current day
- **Jar**: 2D illustrated jar with colored marbles matching the current success count
- **Clock**: Analog clock showing current time (live updating), digital time underneath
- **Avatars**: Both kids' avatars at bottom-right with names

This phase establishes the component architecture, data fetching patterns, and visual foundation that all subsequent phases build on.

### Acceptance criteria

- [ ] Next.js app deploys to Vercel and loads without errors
- [ ] Supabase database has all 6 tables with correct schema and foreign keys
- [ ] Seed script populates realistic sample data (1 family, 2 kids, 1 goal, ~14 daily entries)
- [ ] Dashboard renders calendar grid with 7-day layout, greyed weekend columns
- [ ] Calendar shows decorated success numbers and muted X for misses from seed data
- [ ] Jar displays correct number of marbles matching success count
- [ ] Analog clock shows current time and updates live
- [ ] Top bar shows goal name, prize, and marble count (e.g., "7 / 20")
- [ ] Both kid avatars render with correct icons and colors (Lily: bird/green, Emma: dog/blue)
- [ ] Design token CSS variables are defined and used throughout
- [ ] Page is responsive in landscape orientation on a 10" tablet viewport
- [ ] All text meets minimum font size requirements (16px body, 14px labels)

---

## Phase 2: Check-In Flow

**User stories**: #1, #2, #3, #17, #18, #19

> **Goal**: The core interaction loop works end-to-end. Kids can check in, time validation enforces the deadline, and team completion logic determines daily success or failure. This phase is for Phil to test logic correctness — the app ships to the kids after Phase 3 adds the fun stuff.

### What to build

Implement the check-in interaction flow:

1. **Avatar tap** on the dashboard opens the check-in modal for that kid
2. **Check-in modal** shows the kid's avatar and name, a static visual checklist (icons as reminders — not interactive), the team status bar (who has/hasn't checked in), and a large "I'm Ready!" button
3. **"I'm Ready!" tap** creates a `check_in` record with the current timestamp
4. **Time validation**: If the check-in timestamp is before the goal's deadline → valid. If after → the check-in still records but doesn't count as on-time.
5. **Team completion logic**: After each check-in, evaluate whether ALL participants have valid (on-time) check-ins for today. If yes → update today's `daily_entry` to "success" with the next sequential success number and a random decoration seed. If the deadline passes without all members checking in → "miss."
6. **Dashboard updates**: After check-in, the modal closes and the dashboard reflects the new state (avatar gets a checkmark, count updates if success, calendar day updates).
7. **Duplicate prevention**: If a kid has already checked in today for this goal, show their status rather than allowing a second check-in.

Also implement the daily entry lifecycle: a scheduled or on-load process that creates "pending" entries for each active day and transitions them to "miss" when the deadline passes without team completion.

### Acceptance criteria

- [ ] Tapping a kid's avatar opens the check-in modal with correct name, avatar, and checklist
- [ ] Check-in modal shows which team members have/haven't checked in today
- [ ] "I'm Ready!" creates a `check_in` record in Supabase with correct profile, goal, date, and timestamp
- [ ] Check-in before deadline + all team members checked in → daily entry becomes "success" with correct success number
- [ ] Check-in after deadline → recorded but does not trigger success
- [ ] Deadline passes without all check-ins → daily entry becomes "miss"
- [ ] Duplicate check-in for same kid/goal/day is prevented
- [ ] Dashboard updates after check-in (avatar checkmark, calendar, count)
- [ ] "I'm Ready!" button and avatar tap targets are at least 44x44px
- [ ] Check-in modal has a close/X button to dismiss without checking in
- [ ] Unit tests cover: time validation, team completion logic, success counting, duplicate prevention, daily entry state transitions

---

## Phase 3: Animations, Sounds & Celebrations

**User stories**: #4, #6, #7, #12, #13, #39

> **Goal**: Add the delight layer that makes the app magical for kids. After this phase, the app is ready to ship to the family. Phases 2 + 3 together deliver the complete kid-facing experience for a single team goal.

### What to build

Layer visual feedback and audio onto the check-in flow from Phase 2:

- **Individual check-in**: When a kid taps "I'm Ready!" successfully, their avatar gets an animated checkmark and a marble-drop sound plays.
- **Daily success** (last team member checks in on time): Show the daily success modal — "Amazing!" title, both kids' avatars with checkmarks, marble + jar animation showing the new marble dropping in, updated count. Calendar day animates in with hand-drawn number and random decorations (hearts, stars, rainbows in varying colors). Celebration sound plays.
- **Miss marking**: When a day becomes a miss, the calendar X draws in with a subtle animation (muted purple/grey, not red).
- **Goal completion** (jar reaches target): Big celebration — jar overflows, confetti particles, prize text/emoji revealed with fanfare, extended celebration sound. The completed state persists on the dashboard until parent sets up the next goal.
- **Mute toggle**: Persists to localStorage. When muted, all sounds are suppressed but animations still play (unless reduced-motion is active).
- **Reduced motion**: All animations respect `prefers-reduced-motion: reduce` — replace with instant opacity crossfades or no transition.

Sound inventory: marble drop clink, daily success short fanfare, goal completion celebration, subtle button tap feedback.

### Acceptance criteria

- [ ] Marble-drop animation plays when a kid checks in successfully
- [ ] Marble-drop sound plays on check-in (unless muted)
- [ ] Daily success modal appears with celebration when both kids check in on time
- [ ] Calendar success day animates in with decorated number (unique colors/decorations per day)
- [ ] Miss day X animates in with muted color
- [ ] Goal completion triggers: confetti, jar overflow, prize reveal, fanfare sound
- [ ] Completed goal state displays on dashboard (full jar, prize visible)
- [ ] Mute toggle works and persists across sessions via localStorage
- [ ] All animations respect `prefers-reduced-motion: reduce`
- [ ] Animations use only `transform` and `opacity` (no layout property animation)
- [ ] Animation durations follow PRD guidelines (100-350ms for UI, up to 1000ms for celebrations)
- [ ] All modals have visible close/X buttons

---

## Phase 4: Parent Admin — Goal Management

**User stories**: #22, #25, #26, #27, #28, #29, #30, #31, #32, #33, #34, #35

> **Goal**: Parents can create, configure, edit, and manage goals without touching the database directly. This unlocks the ability to set up new goals when kids complete one, and to adjust configuration when something isn't working.

### What to build

Implement the parent admin panel accessed via the gear icon on the dashboard:

- **Navigation**: Gear icon → `/admin` route. Sidebar with 4 tabs (Goals, Kids, History, Edit Entries). "Back to Dashboard" link. No PIN protection in v1.
- **Goals tab** (this phase):
  - List all goals grouped by status (active, completed, archived) with key info (name, progress, participants)
  - **Create goal form**: Name, description, visual checklist items (icon picker), target count, prize text + emoji, deadline time (optional — null means untimed), active days (Sun-Sat toggle), participants (which kids), team/individual toggle, start date
  - **Edit goal**: Same form, pre-populated. Warn if changing affects in-progress tracking.
  - **Archive**: Move completed goal to archived status
  - **Restart**: Pre-populate a new goal from a completed one (new target, prize, start date)
  - **"+ New Goal"** button

The other 3 admin tabs (Kids, History, Edit Entries) are stubbed with placeholder content — they're built in Phases 5 and 6.

### Acceptance criteria

- [ ] Gear icon on dashboard navigates to `/admin`
- [ ] Admin panel has sidebar with 4 tabs, Goals tab is active by default
- [ ] "Back to Dashboard" returns to `/`
- [ ] Goals tab lists active goals with name, progress, participants, and status
- [ ] "+ New Goal" opens creation form with all configuration fields
- [ ] Goal creation writes correct records to `goals` and `goal_participants` tables
- [ ] Edit goal pre-populates form and updates database on save
- [ ] Archive moves a goal to archived status
- [ ] Restart pre-fills creation form from completed goal (new target, prize, start date)
- [ ] Active days selector allows arbitrary Sun-Sat selection
- [ ] Participant selector shows available child profiles
- [ ] Team/individual toggle works
- [ ] Form validation prevents submission with missing required fields (name, target, at least one participant)

---

## Phase 5: Parent Admin — Daily Corrections & History

**User stories**: #15, #16, #23, #24, #25

> **Goal**: Parents can fix mistakes, handle exceptions, and review past accomplishments. Also enables multiple active goals on the dashboard.

### What to build

Complete the remaining admin tabs and add goal switching:

- **Edit Entries tab**: Select a goal and browse its calendar. Tap any day to change its status (success → miss, miss → success, any → skip, skip → pending). Success number recalculates automatically when entries change. Show confirmation before destructive changes.
- **History tab**: List completed/archived goals with their final stats (total successes, duration, prize earned). Tap to see the full calendar and jar for that goal.
- **Goal selector on dashboard**: If multiple active goals exist, add a way to switch between them on the main dashboard (e.g., swipe or tab selector). Current mockup shows a single goal — the selector appears only when 2+ goals are active.
- **Skip day**: Quick action on the Goals tab or Edit Entries tab to mark today (or a specific day) as "skip" for a goal (holidays, sick days). Skipped days don't count for or against progress.

### Acceptance criteria

- [ ] Edit Entries tab shows a goal picker and calendar view
- [ ] Tapping a calendar day allows changing its status (success/miss/skip/pending)
- [ ] Changing a day's status recalculates success numbers for subsequent days
- [ ] Confirmation prompt before changing a success to miss or skip
- [ ] History tab lists completed/archived goals with stats
- [ ] Tapping a historical goal shows its full calendar and jar
- [ ] Dashboard supports switching between multiple active goals (if more than one exists)
- [ ] Skip day action works from admin panel
- [ ] Skipped days display distinctly on both admin and dashboard calendars

---

## Phase 6: Profiles, Real-Time Sync & Polish

**User stories**: #14, #36, #37, #38, #40

> **Goal**: Complete the v1 feature set. Kid profiles are manageable, devices stay in sync, and the app feels polished and fast on a shared tablet.

### What to build

- **Kids tab in admin**: List child profiles with avatar and color. Add new child (name, avatar, color). Edit existing child (change name, avatar, color). Avatar picker with 8-12 illustrated options (must include dog, cat, bird/penguin, and whimsical creatures). Color picker for the child's accent color.
- **Supabase Realtime**: Subscribe to `check_ins` and `daily_entries` tables so all connected devices update immediately when a kid checks in. No manual refresh needed.
- **Performance polish**: Ensure the dashboard loads fast on tablet. Optimize Supabase queries. Lazy-load celebration assets (sounds, confetti). Ensure animations hit 60fps.
- **Responsive refinements**: Verify all layouts work on 10" tablet in landscape. Test touch interactions on actual iPad. Ensure no tap-through issues on modals.
- **Final QA sweep**: Test the full flow end-to-end (create goal → kids check in daily → goal completes → restart). Verify all edge cases (late check-in, duplicate tap, deadline exactly at boundary, skip day).

### Acceptance criteria

- [ ] Kids tab lists child profiles with avatars and colors
- [ ] Add child creates a new profile with name, avatar, and color
- [ ] Edit child updates name, avatar, or color
- [ ] Avatar picker shows 8-12 illustrated options
- [ ] Color picker allows selecting a child's accent color
- [ ] Dashboard updates in real-time across devices when a check-in happens (no refresh)
- [ ] Daily entry status changes propagate in real-time
- [ ] App loads in under 3 seconds on a typical tablet connection
- [ ] All animations run at 60fps on iPad
- [ ] Full end-to-end flow works: create goal → daily check-ins → goal completion → restart
- [ ] Edge cases handled: late check-in, duplicate tap, skip day, goal with no active days today
