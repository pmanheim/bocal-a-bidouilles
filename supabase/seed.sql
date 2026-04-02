-- Bocal a Bidouilles — Seed Data
-- Run this in the Supabase SQL Editor AFTER the migrations.
-- Creates: 1 family, 3 profiles, 1 goal, 8 daily entries with check-ins.

-- Use fixed UUIDs so foreign keys can reference them
-- Family
insert into families (id, name) values
  ('a1b2c3d4-0000-4000-8000-000000000001', 'Manheim Family');

-- Profiles (2 kids + 1 parent)
insert into profiles (id, family_id, name, avatar, role, color) values
  ('b1b2c3d4-0000-4000-8000-000000000001', 'a1b2c3d4-0000-4000-8000-000000000001', 'Lily', 'bird', 'child', '#4CAF50'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'a1b2c3d4-0000-4000-8000-000000000001', 'Emma', 'dog', 'child', '#2196F3'),
  ('b1b2c3d4-0000-4000-8000-000000000003', 'a1b2c3d4-0000-4000-8000-000000000001', 'Phil', 'cat', 'parent', null);

-- Goal: "Ready for School!" — weekdays, 8:00 AM deadline, team goal, target 20
insert into goals (id, family_id, name, description, checklist_items, target_count, prize_text, prize_emoji, deadline_time, active_days, is_team, status, start_date, timezone) values
  ('c1b2c3d4-0000-4000-8000-000000000001',
   'a1b2c3d4-0000-4000-8000-000000000001',
   'Ready for School!',
   'Be fully ready for school before 8:00 AM',
   '["teeth", "clothes", "shoes", "breakfast", "bathroom"]',
   20,
   'Ice Cream Sundae Party',
   '🍨',
   '08:00:00',
   '[1,2,3,4,5]',
   true,
   'active',
   '2026-03-23',
   'America/Los_Angeles');

-- Goal participants (both kids)
insert into goal_participants (goal_id, profile_id) values
  ('c1b2c3d4-0000-4000-8000-000000000001', 'b1b2c3d4-0000-4000-8000-000000000001'),
  ('c1b2c3d4-0000-4000-8000-000000000001', 'b1b2c3d4-0000-4000-8000-000000000002');

-- Daily entries: Mon 3/23 – Wed 4/1 (weekdays only)
-- 3 successes (Thu 3/26, Tue 3/31, Wed 4/1), 5 misses
insert into daily_entries (goal_id, date, status, success_number, decoration_seed) values
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-23', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-24', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-25', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', 'success', 1, 4217),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-27', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-30', 'miss',    null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-31', 'success', 2, 8531),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-04-01', 'success', 3, 2694);

-- Check-ins for success days (both kids checked in before 8:00 AM PDT)
insert into check_ins (profile_id, goal_id, date, checked_in_at) values
  -- Thu 3/26
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', '2026-03-26 07:45:00-07'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', '2026-03-26 07:50:00-07'),
  -- Tue 3/31
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-31', '2026-03-31 07:40:00-07'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-31', '2026-03-31 07:55:00-07'),
  -- Wed 4/1
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-04-01', '2026-04-01 07:48:00-07'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-04-01', '2026-04-01 07:52:00-07');
