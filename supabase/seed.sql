-- Bocal a Bidouilles — Seed Data
-- Run this in the Supabase SQL Editor AFTER the migration.
-- Creates: 1 family, 3 profiles, 1 goal, ~14 daily entries with check-ins.

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
insert into goals (id, family_id, name, description, checklist_items, target_count, prize_text, prize_emoji, deadline_time, active_days, is_team, status, start_date) values
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
   '2026-03-16');

-- Goal participants (both kids)
insert into goal_participants (goal_id, profile_id) values
  ('c1b2c3d4-0000-4000-8000-000000000001', 'b1b2c3d4-0000-4000-8000-000000000001'),
  ('c1b2c3d4-0000-4000-8000-000000000001', 'b1b2c3d4-0000-4000-8000-000000000002');

-- Daily entries: 2 weeks of weekdays (Mar 16–27, 2026)
-- Mix of successes, misses, and pending
insert into daily_entries (goal_id, date, status, success_number, decoration_seed) values
  -- Week 1: Mon Mar 16 – Fri Mar 20
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-16', 'success', 1, 42),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-17', 'success', 2, 87),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-18', 'miss', null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-19', 'success', 3, 23),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-20', 'success', 4, 65),
  -- Week 2: Mon Mar 23 – Fri Mar 27
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-23', 'success', 5, 14),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-24', 'miss', null, null),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-25', 'success', 6, 91),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', 'success', 7, 38),
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-27', 'pending', null, null),
  -- Week 3: Mon Mar 30 (today)
  ('c1b2c3d4-0000-4000-8000-000000000001', '2026-03-30', 'pending', null, null);

-- Check-ins for success days (both kids checked in before 8:00 AM)
insert into check_ins (profile_id, goal_id, date, checked_in_at) values
  -- Mar 16
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-16', '2026-03-16 07:45:00+00'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-16', '2026-03-16 07:48:00+00'),
  -- Mar 17
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-17', '2026-03-17 07:30:00+00'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-17', '2026-03-17 07:55:00+00'),
  -- Mar 19
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-19', '2026-03-19 07:40:00+00'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-19', '2026-03-19 07:50:00+00'),
  -- Mar 20
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-20', '2026-03-20 07:35:00+00'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-20', '2026-03-20 07:42:00+00'),
  -- Mar 23
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-23', '2026-03-23 07:50:00+00'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-23', '2026-03-23 07:52:00+00'),
  -- Mar 25
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-25', '2026-03-25 07:38:00+00'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-25', '2026-03-25 07:44:00+00'),
  -- Mar 26
  ('b1b2c3d4-0000-4000-8000-000000000001', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', '2026-03-26 07:55:00+00'),
  ('b1b2c3d4-0000-4000-8000-000000000002', 'c1b2c3d4-0000-4000-8000-000000000001', '2026-03-26', '2026-03-26 07:58:00+00');
