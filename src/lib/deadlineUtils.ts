/**
 * Check if the current time is past the goal's deadline.
 * Returns false if no deadline is set (untimed goals).
 */
export function isAfterDeadline(
  now: Date,
  deadlineTime: string | null
): boolean {
  if (!deadlineTime) return false;

  const [hours, minutes, seconds] = deadlineTime.split(":").map(Number);
  const deadline = new Date(now);
  deadline.setHours(hours, minutes, seconds ?? 0, 0);

  return now > deadline;
}
