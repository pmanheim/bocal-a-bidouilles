/**
 * Timezone-aware date/time utilities.
 *
 * All functions accept an IANA timezone string (e.g., "America/Los_Angeles")
 * and use Intl.DateTimeFormat so they produce correct results regardless of
 * the server's system timezone (UTC on Vercel, local on dev machines).
 */

/**
 * Get a date as a YYYY-MM-DD string in the specified timezone.
 * Uses 'en-CA' locale which natively formats as YYYY-MM-DD.
 */
export function getDateInTimezone(date: Date, timezone: string): string {
  return date.toLocaleDateString("en-CA", { timeZone: timezone });
}

/**
 * Get the day of week (0=Sun, 1=Mon, ..., 6=Sat) in the specified timezone.
 */
export function getDayOfWeekInTimezone(
  date: Date,
  timezone: string
): number {
  const dateStr = getDateInTimezone(date, timezone);
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

/**
 * Check if the current time is past the goal's deadline in the specified timezone.
 * Compares HH:MM:SS strings so it works regardless of server timezone.
 * Returns false if no deadline is set (untimed goals).
 */
export function isAfterDeadline(
  now: Date,
  deadlineTime: string | null,
  timezone: string
): boolean {
  if (!deadlineTime) return false;

  // Get current time as HH:MM:SS in the goal's timezone
  const currentTime = now.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Normalize deadline to HH:MM:SS for comparison (DB stores "08:00:00", form sends "08:00")
  const normalizedDeadline =
    deadlineTime.length === 5 ? deadlineTime + ":00" : deadlineTime;

  return currentTime > normalizedDeadline;
}
