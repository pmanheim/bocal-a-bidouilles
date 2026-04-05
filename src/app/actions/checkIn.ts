"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getDateInTimezone, isAfterDeadline } from "@/lib/deadlineUtils";
import {
  bootstrapDailyEntries,
  evaluateTeamCompletion,
} from "@/lib/dailyEntryLifecycle";

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

  const { data: goal, error: goalError } = await supabase
    .from("goals")
    .select("deadline_time, is_team, timezone")
    .eq("id", goalId)
    .single();

  if (goalError || !goal) {
    return { success: false, error: "Failed to load goal" };
  }

  const tz = goal.timezone;
  const today = getDateInTimezone(now, tz);
  const isLate = isAfterDeadline(now, goal.deadline_time, tz);

  // Insert check-in record — DB unique constraint prevents duplicates
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

  if (isLate) {
    revalidatePath("/");
    return { success: true, isLate: true };
  }

  // Delegate team evaluation to the lifecycle module
  const dailyStatus = await evaluateTeamCompletion(
    supabase,
    goalId,
    goal.is_team,
    goal.deadline_time,
    today,
    tz
  );

  revalidatePath("/");
  return { success: true, isLate: false, dailyStatus };
}

/**
 * Page-load bootstrapping — thin wrapper around lifecycle module.
 */
export async function ensureDailyEntries(goalId: string) {
  const supabase = await createClient();
  await bootstrapDailyEntries(supabase, goalId);
}
