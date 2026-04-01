"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface CheckInResult {
  success: boolean;
  error?: string;
}

export async function recordCheckIn(
  profileId: string,
  goalId: string
): Promise<CheckInResult> {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toISOString();

  // Insert the check-in record — DB unique constraint on
  // (profile_id, goal_id, date) prevents duplicates
  const { error: insertError } = await supabase.from("check_ins").insert({
    profile_id: profileId,
    goal_id: goalId,
    date: today,
    checked_in_at: now,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, error: "Already checked in today" };
    }
    return { success: false, error: "Failed to record check-in" };
  }

  revalidatePath("/");

  return { success: true };
}
