"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { EntryStatus } from "@/types/database";

/**
 * Recalculate sequential success_number for all success entries of a goal.
 * Called after any status change to keep marble numbers in order.
 */
async function recalculateSuccessNumbers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  goalId: string
) {
  const { data: successes } = await supabase
    .from("daily_entries")
    .select("id, date")
    .eq("goal_id", goalId)
    .eq("status", "success")
    .order("date", { ascending: true });

  if (!successes || successes.length === 0) return;

  // Bulk update each success with its correct sequential number
  for (let i = 0; i < successes.length; i++) {
    await supabase
      .from("daily_entries")
      .update({ success_number: i + 1 })
      .eq("id", successes[i].id);
  }
}

/**
 * Change a daily entry's status. Handles success_number and decoration_seed
 * assignment/clearing, then recalculates all success numbers for the goal.
 */
export async function updateEntryStatus(
  entryId: string,
  goalId: string,
  newStatus: EntryStatus
) {
  const supabase = await createClient();

  const updateData: Record<string, unknown> = { status: newStatus };

  if (newStatus === "success") {
    // Will be recalculated below, but set a seed now
    updateData.decoration_seed = Math.floor(Math.random() * 10000);
  } else {
    // Clear success-specific fields
    updateData.success_number = null;
    updateData.decoration_seed = null;
  }

  const { error } = await supabase
    .from("daily_entries")
    .update(updateData)
    .eq("id", entryId);

  if (error) throw new Error(`Failed to update entry: ${error.message}`);

  // Recalculate all success numbers to keep sequence correct
  await recalculateSuccessNumbers(supabase, goalId);

  revalidatePath("/admin/entries");
  revalidatePath("/");
}

/**
 * Mark a specific date as "skip" for a goal. Creates the entry if it
 * doesn't exist, or updates it if it does.
 */
export async function skipDay(goalId: string, date: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("daily_entries")
    .upsert(
      {
        goal_id: goalId,
        date,
        status: "skip" as const,
        success_number: null,
        decoration_seed: null,
      },
      { onConflict: "goal_id,date" }
    );

  if (error) throw new Error(`Failed to skip day: ${error.message}`);

  await recalculateSuccessNumbers(supabase, goalId);

  revalidatePath("/admin/entries");
  revalidatePath("/");
}
