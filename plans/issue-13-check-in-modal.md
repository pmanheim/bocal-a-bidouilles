# Plan: Issue #13 — Check-In Modal and Recording

> Branch: `feat/check-in-modal`
> Parallel with: Issue #17 (admin shell) — do NOT modify any files in `/admin` or `src/app/actions/goals.ts`

## What to build

The check-in modal is the core kid-facing interaction. Per the PRD, kids complete all tasks around the house, come to the tablet once, and check in — the checklist is a visual reminder, not interactive.

### Modal contents (from mockup — screenshot node `QXPbu` and `1o9X4`)
- Kid's avatar (large green/blue circle with emoji) + name
- "Have you done everything?" prompt
- 5 checklist icons in rounded squares: Teeth, Clothes, Potty, Breakfast, Shoes — view-only
- Team status bar: green pill for kid checking in, muted for other kid(s)
- Large rounded green "I'm Ready!" button (18px+ text per PRD)
- X close button top-right (44x44px minimum)
- Semi-transparent backdrop dismisses on tap

### Server Action behavior
- Insert `check_in` record (profile_id, goal_id, date, timestamp)
- Check for duplicates (same profile/goal/date) — prevent double check-in
- Return updated check-in status for all participants
- `revalidatePath("/")` to refresh dashboard
- Does NOT evaluate success/miss — that's #14's scope. The action simply records the check-in.

### Dashboard changes
- Avatar shows checkmark overlay after check-in
- Page fetches today's check-ins to determine initial state

## Technical approach

1. **`ParticipantAvatars` becomes a Client Component** — needs `onClick` to open modal + state for which kid's modal is open
2. **New `CheckInModal` Client Component** — receives kid profile, goal info, today's check-in status for all participants
3. **New `src/app/actions/checkIn.ts`** Server Action — insert check-in, duplicate guard, revalidate
4. **`page.tsx`** modified — fetch today's check-ins alongside existing queries, pass to ParticipantAvatars

## Files
- **New:** `src/app/components/CheckInModal.tsx`, `src/app/actions/checkIn.ts`
- **Modified:** `src/app/components/ParticipantAvatars.tsx` (add "use client", onClick, modal state)
- **Modified:** `src/app/page.tsx` (fetch today's check-ins, pass as props)

## What this does NOT include (deferred to #14)
- Time validation (before/after deadline)
- Late check-in UX — #14 will add an `isLate` prop to CheckInModal that switches the modal to show encouraging "you were late" messages with an acknowledgment button instead of "I'm Ready!". The check-in is still recorded but marked as a miss. Messages are randomly selected from pools of 4-5 variants across 4 categories (timed/untimed x individual/team). See PRD "Late check-in UX" section for full details.
- Team completion logic (all members → success)
- Daily entry status transitions (pending → success/miss)
- Daily entry auto-creation for pending days

## Mockup references
- Check-in modal card: node `QXPbu` in `designs/bocal-mockups.pen`
- Full screen with modal overlay: node `1o9X4`
- Dashboard (for avatar reference): node `MJa08`

## Important constraints
- All touch targets 44x44px minimum (PRD requirement)
- "I'm Ready!" button text 18px+ (PRD typography requirement)
- Modal must have visible X close button AND backdrop dismissal
- Checklist is view-only — NOT interactive (PRD: kids check in once at tablet, not running back and forth)
- This branch must NOT touch any files in `src/app/admin/` or `src/app/actions/goals.ts` — those are being modified by Issue #17 in a parallel session

## PRD context
- Physical context: tablet by the front door, kids complete tasks around the house then come check in once
- The checklist icons are: Teeth, Clothes, Potty, Breakfast, Shoes
- For team goals, all kids must check in for success (but success/miss evaluation is #14's scope)
- Duplicate check-in prevention: same kid/goal/day cannot check in twice
