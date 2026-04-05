-- Add updated_by column to daily_entries table.
-- Tracks who last changed the entry status:
--   'system'     — auto-created by ensureDailyEntries (page load bootstrapping)
--   'admin'      — parent correction via Edit Entries
--   <profile_id> — kid check-in triggered the status change
-- Used by ensureDailyEntries to avoid overwriting admin/check-in edits.

ALTER TABLE daily_entries
  ADD COLUMN updated_by TEXT NOT NULL DEFAULT 'system';

COMMENT ON COLUMN daily_entries.updated_by IS 'Who last changed this entry: system, admin, or a profile_id';
