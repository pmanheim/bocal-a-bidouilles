"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { isAfterDeadline } from "@/lib/deadlineUtils";

interface CheckInResult {
  success: boolean;
  error?: string;
  isLate?: boolean;
  dailyStatus?: "success" | "pending";
}

export async function recordCheckIn(
  profileId: string,
  goalId: string
): Promise<CheckInResult> {
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  // Fetch goal to check deadline_time and is_team
  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("deadline_time, is_team")
    .eq("id", goalId)
    .single();

  if (goalError || !goal) {
    return { success: false, error: "Failed to load goal" };
  }

  // Determine if this check-in is late
  const isLate = isAfterDeadline(now, goal.deadline_time);

  // Insert the check-in record — DB unique constraint prevents duplicates
  const { error: insertError } = await supabase.from("check_ins").insert({
    profile_id: profileId,
    goal_id: goalId,
    date: today,
    checked_in_at: now.toISOString(),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, error: "Already checked in today" };
    }
    return { success: false, error: "Failed to record check-in" };
  }

  // If late, just record it — don't evaluate success
  if (isLate) {
    revalidatePath("/");
    return { success: true, isLate: true };
  }

  // Evaluate team completion for on-time check-ins
  const dailyStatus = await evaluateTeamCompletion(
    supabase,
    goalId,
    goal.is_team,
    goal.deadline_time,
    today
  );

  revalidatePath("/");
  return { success: true, isLate: false, dailyStatus };
}

/**
 * After an on-time check-in, check if all team members have checked in
 * on time. If so, mark the daily entry as "success".
 */
async function evaluateTeamCompletion(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  goalId: string,
  isTeam: boolean,
  deadlineTime: string | null,
  today: string
): Promise<"success" | "pending"> {
  // Fetch participants and today's check-ins in parallel
  const [{ data: participants }, { data: checkIns }] = await Promise.all([
    supabase
      .from("goal_participants")
      .select("profile_id")
      .eq("goal_id", goalId),
    supabase
      .from("check_ins")
      .select("profile_id, checked_in_at")
      .eq("goal_id", goalId)
      .eq("date", today),
  ]);

  if (!participants || participants.length === 0 || !checkIns) return "pending";

  // For team goals, all participants must have on-time check-ins
  // For individual goals, just the current check-in being on-time is enough
  const participantIds = new Set(participants.map((p) => p.profile_id));
  const onTimeCheckIns = new Set(
    checkIns
      .filter((c) => {
        if (!deadlineTime) return true; // untimed = always on time
        return !isAfterDeadline(new Date(c.checked_in_at), deadlineTime);
      })
      .map((c) => c.profile_id)
  );

  const allCheckedIn = isTeam
    ? [...participantIds].every((id) => onTimeCheckIns.has(id))
    : onTimeCheckIns.size > 0;

  if (!allCheckedIn) return "pending";

  // All conditions met — mark today as success
  await markDayAsSuccess(supabase, goalId, today);
  return "success";
}

/**
 * Create or update today's daily entry to "success" with sequential
 * success_number and random decoration_seed.
 */
async function markDayAsSuccess(
  supabase: Awaited<ReturnType<typeof import("@/lib/supabase/server").createClient>>,
  goalId: string,
  date: string
) {
  // Count existing successes to determine next success_number
  const { count } = await supabase
    .from("daily_entries")
    .select("*", { count: "exact", head: true })
    .eq("goal_id", goalId)
    .eq("status", "success");

  const successNumber = (count ?? 0) + 1;
  const decorationSeed = Math.floor(Math.random() * 10000);

  // Upsert: create if doesn't exist, update if it does (e.g., was "pending")
  await supabase
    .from("daily_entries")
    .upsert(
      {
        goal_id: goalId,
        date,
        status: "success" as const,
        success_number: successNumber,
        decoration_seed: decorationSeed,
      },
      { onConflict: "goal_id,date" }
    );
}

/**
 * Ensure today's daily entry exists as "pending" (if today is an active day).
 * Transition any past pending entries to "miss" if their deadline has passed.
 * Called from page.tsx on dashboard load.
 */
export async function ensureDailyEntries(goalId: string) {
  const supabase = await createClient();
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

  // Fetch goal config
  const { data: goal } = await supabase
    .from("goals")
    .select("active_days, deadline_time, start_date")
    .eq("id", goalId)
    .single();

  if (!goal) return;

  const activeDays = (goal.active_days as number[]) ?? [];

  // Create today's entry if it's an active day and doesn't exist yet
  if (activeDays.includes(dayOfWeek) && today >= goal.start_date) {
    const { data: todayEntry } = await supabase
      .from("daily_entries")
      .select("id")
      .eq("goal_id", goalId)
      .eq("date", today)
      .maybeSingle();

    if (!todayEntry) {
      await supabase.from("daily_entries").insert({
        goal_id: goalId,
        date: today,
        status: "pending" as const,
      });
    }
  }

  // Transition past pending entries to "miss" if deadline has passed
  if (goal.deadline_time) {
    const { data: pendingEntries } = await supabase
      .from("daily_entries")
      .select("id, date")
      .eq("goal_id", goalId)
      .eq("status", "pending")
      .lte("date", today);

    if (pendingEntries) {
      // Past days are always missed; today is missed only if deadline has passed
      const missedIds = pendingEntries
        .filter((entry) => {
          if (entry.date < today) return true;
          return entry.date === today && isAfterDeadline(now, goal.deadline_time);
        })
        .map((entry) => entry.id);

      if (missedIds.length > 0) {
        await supabase
          .from("daily_entries")
          .update({ status: "miss" as const })
          .in("id", missedIds);
      }
    }
  }
}
