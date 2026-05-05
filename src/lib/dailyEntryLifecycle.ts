/**
 * Daily Entry Lifecycle — single source of truth for all daily_entries mutations.
 *
 * Every function takes a TypedSupabaseClient as its first argument so it can be
 * called from server actions (which create their own client) or composed within
 * other operations. No "use server", no revalidatePath, no Next.js dependencies.
 */

import type { TypedSupabaseClient } from "@/lib/supabase/server";
import type { EntryStatus } from "@/types/database";
import {
  getDateInTimezone,
  isAfterDeadline,
} from "@/lib/deadlineUtils";

// ── Success Number Management ──────────────────────────────────────

/**
 * Recalculate sequential success_number for all success entries of a goal.
 * Called internally after every mutation that could affect success ordering.
 */
export async function recalculateSuccessNumbers(
  supabase: TypedSupabaseClient,
  goalId: string
) {
  // First, clear all success numbers
  await supabase
    .from("daily_entries")
    .update({ success_number: null })
    .eq("goal_id", goalId)
    .neq("status", "success");

  // Get all successes ordered by date
  const { data: successes } = await supabase
    .from("daily_entries")
    .select("id")
    .eq("goal_id", goalId)
    .eq("status", "success")
    .order("date", { ascending: true });

  if (!successes || successes.length === 0) return;

  // Sequential renumber — each success gets its correct position
  for (let i = 0; i < successes.length; i++) {
    await supabase
      .from("daily_entries")
      .update({ success_number: i + 1 })
      .eq("id", successes[i].id);
  }
}

// ── Page Load Bootstrapping ────────────────────────────────────────

/**
 * Ensure every past active-weekday from start_date through today has a daily
 * entry, and transition stale pending entries to "miss". Called on dashboard
 * and admin page loads. Respects admin edits via updated_by — existing entries
 * are never overwritten.
 *
 * Why back-fill the past: if the app isn't opened on a given day, we still want
 * the calendar and Edit Entries screen to record it as a miss. Otherwise the
 * day silently disappears from history.
 */
export async function bootstrapDailyEntries(
  supabase: TypedSupabaseClient,
  goalId: string
) {
  const now = new Date();

  const { data: goal } = await supabase
    .from("goals")
    .select("active_days, deadline_time, start_date, timezone")
    .eq("id", goalId)
    .single();

  if (!goal) return;

  const tz = goal.timezone;
  const today = getDateInTimezone(now, tz);
  const activeDays = (goal.active_days as number[]) ?? [];
  const pastDeadline = isAfterDeadline(now, goal.deadline_time, tz);

  // Build the list of active-weekday dates from start_date through today
  const expectedDates: string[] = [];
  if (today >= goal.start_date) {
    const [sy, sm, sd] = goal.start_date.split("-").map(Number);
    const [ty, tm, td] = today.split("-").map(Number);
    const cursor = new Date(sy, sm - 1, sd);
    const end = new Date(ty, tm - 1, td);
    while (cursor <= end) {
      if (activeDays.includes(cursor.getDay())) {
        const yyyy = cursor.getFullYear();
        const mm = String(cursor.getMonth() + 1).padStart(2, "0");
        const dd = String(cursor.getDate()).padStart(2, "0");
        expectedDates.push(`${yyyy}-${mm}-${dd}`);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  if (expectedDates.length > 0) {
    const { data: existing } = await supabase
      .from("daily_entries")
      .select("date")
      .eq("goal_id", goalId)
      .in("date", expectedDates);

    const existingDates = new Set(
      (existing ?? []).map((e: { date: string }) => e.date)
    );

    const toInsert = expectedDates
      .filter((date) => !existingDates.has(date))
      .map((date) => ({
        goal_id: goalId,
        date,
        status: (date < today || pastDeadline ? "miss" : "pending") as
          | "miss"
          | "pending",
        updated_by: "system",
      }));

    if (toInsert.length > 0) {
      await supabase.from("daily_entries").insert(toInsert);
    }
  }

  // Transition past pending entries to "miss" — but only system-created ones
  if (goal.deadline_time) {
    const { data: pendingEntries } = await supabase
      .from("daily_entries")
      .select("id, date")
      .eq("goal_id", goalId)
      .eq("status", "pending")
      .eq("updated_by", "system")
      .lte("date", today);

    if (pendingEntries) {
      const missedIds = pendingEntries
        .filter((entry: { id: string; date: string }) => {
          if (entry.date < today) return true;
          return entry.date === today && pastDeadline;
        })
        .map((entry: { id: string; date: string }) => entry.id);

      if (missedIds.length > 0) {
        await supabase
          .from("daily_entries")
          .update({ status: "miss" as const, updated_by: "system" })
          .in("id", missedIds);
      }
    }
  }
}

// ── Check-In Flow ──────────────────────────────────────────────────

/**
 * After an on-time check-in, evaluate whether the team (or individual)
 * has completed today's goal. If so, mark the day as success.
 */
export async function evaluateTeamCompletion(
  supabase: TypedSupabaseClient,
  goalId: string,
  isTeam: boolean,
  deadlineTime: string | null,
  today: string,
  timezone: string
): Promise<"success" | "pending"> {
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

  const participantIds = new Set(participants.map((p: { profile_id: string }) => p.profile_id));
  const onTimeCheckIns = new Set(
    checkIns
      .filter((c: { profile_id: string; checked_in_at: string }) => {
        if (!deadlineTime) return true;
        return !isAfterDeadline(new Date(c.checked_in_at), deadlineTime, timezone);
      })
      .map((c: { profile_id: string }) => c.profile_id)
  );

  const allCheckedIn = isTeam
    ? [...participantIds].every((id) => onTimeCheckIns.has(id))
    : onTimeCheckIns.size > 0;

  if (!allCheckedIn) return "pending";

  await markDayAsSuccess(supabase, goalId, today);
  return "success";
}

/**
 * Mark a day as success. Upserts the entry, assigns a decoration seed,
 * and recalculates all success numbers for correct marble ordering.
 */
export async function markDayAsSuccess(
  supabase: TypedSupabaseClient,
  goalId: string,
  date: string,
  updatedBy: string = "system"
) {
  const decorationSeed = Math.floor(Math.random() * 10000);

  await supabase
    .from("daily_entries")
    .upsert(
      {
        goal_id: goalId,
        date,
        status: "success" as const,
        decoration_seed: decorationSeed,
        updated_by: updatedBy,
      },
      { onConflict: "goal_id,date" }
    );

  // Always recalculate — the single source of truth for success_number
  await recalculateSuccessNumbers(supabase, goalId);
}

// ── Admin Corrections ──────────────────────────────────────────────

/**
 * Change a daily entry's status. Handles success fields and recalculation.
 * Marks the entry as admin-edited so bootstrapping won't overwrite it.
 */
export async function transitionEntryStatus(
  supabase: TypedSupabaseClient,
  entryId: string,
  goalId: string,
  newStatus: EntryStatus
) {
  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_by: "admin",
  };

  if (newStatus === "success") {
    updateData.decoration_seed = Math.floor(Math.random() * 10000);
  } else {
    updateData.success_number = null;
    updateData.decoration_seed = null;
  }

  const { error } = await supabase
    .from("daily_entries")
    .update(updateData)
    .eq("id", entryId);

  if (error) throw new Error(`Failed to update entry: ${error.message}`);

  await recalculateSuccessNumbers(supabase, goalId);
}

/**
 * Mark a specific date as "skip". Creates or updates the entry.
 * Marks as admin-edited.
 */
export async function skipDay(
  supabase: TypedSupabaseClient,
  goalId: string,
  date: string
) {
  const { error } = await supabase
    .from("daily_entries")
    .upsert(
      {
        goal_id: goalId,
        date,
        status: "skip" as const,
        success_number: null,
        decoration_seed: null,
        updated_by: "admin",
      },
      { onConflict: "goal_id,date" }
    );

  if (error) throw new Error(`Failed to skip day: ${error.message}`);

  await recalculateSuccessNumbers(supabase, goalId);
}
