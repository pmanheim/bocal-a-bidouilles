-- Run this in Supabase SQL Editor.
-- Resets the "Ready for School!" goal to start 2026-03-23 with correct entries.
-- Assumes migration 00002 (timezone column) has already been applied.

-- ── Step 1: Update goal config ──
UPDATE goals
  SET start_date = '2026-03-23',
      timezone = 'America/Los_Angeles'
  WHERE id = 'c1b2c3d4-0000-4000-8000-000000000001';

-- ── Step 2: Clear existing entries and check-ins ──
DELETE FROM check_ins
  WHERE goal_id = 'c1b2c3d4-0000-4000-8000-000000000001';

DELETE FROM daily_entries
  WHERE goal_id = 'c1b2c3d4-0000-4000-8000-000000000001';

-- ── Step 3: Insert correct daily entries (3 successes, 5 misses) ──
INSERT INTO daily_entries (goal_id, date, status, success_number, decoration_seed) VALUES
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-23', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-24', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-25', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', 'success', 1, 4217),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-27', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-30', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-31', 'success', 2, 8531),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-04-01', 'success', 3, 2694);

-- ── Step 4: Insert check-ins for success days ──
-- Both kids checked in before 8:00 AM PDT (UTC-7) on success days
INSERT INTO check_ins (profile_id, goal_id, date, checked_in_at) VALUES
  -- Thu 3/26 — success
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', '2026-03-26 07:45:00-07'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', '2026-03-26 07:50:00-07'),
  -- Tue 3/31 — success (yesterday)
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-31', '2026-03-31 07:40:00-07'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-31', '2026-03-31 07:55:00-07'),
  -- Wed 4/1 — success (today)
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-04-01', '2026-04-01 07:48:00-07'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-04-01', '2026-04-01 07:52:00-07');
