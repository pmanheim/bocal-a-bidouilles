-- Add timezone column to goals table.
-- Each goal stores its IANA timezone (e.g., 'America/Los_Angeles') so that
-- deadline checks, day-of-week calculations, and "today" determination
-- work correctly regardless of server timezone.

ALTER TABLE goals
  ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/Los_Angeles';

COMMENT ON COLUMN goals.timezone IS 'IANA timezone identifier (e.g., America/Los_Angeles). Used for deadline and date calculations.';
