"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { GoalStatus } from "@/types/database";

function parseTargetCount(raw: string): number {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) throw new Error("Target count must be at least 1");
  return n;
}

export async function createGoal(formData: FormData) {
  const supabase = await createClient();

  const { data: family } = await supabase
    .from("families")
    .select("id")
    .limit(1)
    .single();
  if (!family) throw new Error("No family found");

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const checklistItems = JSON.parse(
    (formData.get("checklist_items") as string) || "[]"
  );
  const targetCount = parseTargetCount(formData.get("target_count") as string);
  const prizeText = formData.get("prize_text") as string;
  const prizeEmoji = (formData.get("prize_emoji") as string) || null;
  const deadlineTime = (formData.get("deadline_time") as string) || null;
  const activeDays = JSON.parse(
    (formData.get("active_days") as string) || "[]"
  );
  const isTeam = formData.get("is_team") === "true";
  const startDate = formData.get("start_date") as string;
  const participants: string[] = JSON.parse(
    (formData.get("participants") as string) || "[]"
  );

  const { data: goal, error } = await supabase
    .from("goals")
    .insert({
      family_id: family.id,
      name,
      description,
      checklist_items: checklistItems,
      target_count: targetCount,
      prize_text: prizeText,
      prize_emoji: prizeEmoji,
      deadline_time: deadlineTime,
      active_days: activeDays,
      is_team: isTeam,
      start_date: startDate,
      status: "active" as GoalStatus,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (participants.length > 0) {
    const { error: partError } = await supabase
      .from("goal_participants")
      .insert(
        participants.map((profileId) => ({
          goal_id: goal.id,
          profile_id: profileId,
        }))
      );
    if (partError) throw new Error(partError.message);
  }

  revalidatePath("/admin");
}

export async function updateGoal(goalId: string, formData: FormData) {
  const supabase = await createClient();

  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const checklistItems = JSON.parse(
    (formData.get("checklist_items") as string) || "[]"
  );
  const targetCount = parseTargetCount(formData.get("target_count") as string);
  const prizeText = formData.get("prize_text") as string;
  const prizeEmoji = (formData.get("prize_emoji") as string) || null;
  const deadlineTime = (formData.get("deadline_time") as string) || null;
  const activeDays = JSON.parse(
    (formData.get("active_days") as string) || "[]"
  );
  const isTeam = formData.get("is_team") === "true";
  const startDate = formData.get("start_date") as string;
  const participants: string[] = JSON.parse(
    (formData.get("participants") as string) || "[]"
  );

  const { error } = await supabase
    .from("goals")
    .update({
      name,
      description,
      checklist_items: checklistItems,
      target_count: targetCount,
      prize_text: prizeText,
      prize_emoji: prizeEmoji,
      deadline_time: deadlineTime,
      active_days: activeDays,
      is_team: isTeam,
      start_date: startDate,
    })
    .eq("id", goalId);

  if (error) throw new Error(error.message);

  // Replace participants: delete existing, then insert new
  const { error: delError } = await supabase
    .from("goal_participants")
    .delete()
    .eq("goal_id", goalId);
  if (delError) throw new Error(delError.message);

  if (participants.length > 0) {
    const { error: partError } = await supabase
      .from("goal_participants")
      .insert(
        participants.map((profileId) => ({
          goal_id: goalId,
          profile_id: profileId,
        }))
      );
    if (partError) throw new Error(partError.message);
  }

  revalidatePath("/admin");
}

export async function archiveGoal(goalId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("goals")
    .update({ status: "archived" as GoalStatus })
    .eq("id", goalId);

  if (error) throw new Error(error.message);

  revalidatePath("/admin");
}

export async function restartGoal(goalId: string, formData: FormData) {
  const supabase = await createClient();

  // Fetch the existing goal to copy its configuration
  const { data: existing } = await supabase
    .from("goals")
    .select("*, goal_participants(profile_id)")
    .eq("id", goalId)
    .single();

  if (!existing) throw new Error("Goal not found");

  const targetCount = parseTargetCount(formData.get("target_count") as string);
  const prizeText = formData.get("prize_text") as string;
  const prizeEmoji = (formData.get("prize_emoji") as string) || null;
  const startDate = formData.get("start_date") as string;

  // Create the new goal FIRST — if this fails, the old goal is untouched
  const { data: newGoal, error } = await supabase
    .from("goals")
    .insert({
      family_id: existing.family_id,
      name: existing.name,
      description: existing.description,
      checklist_items: existing.checklist_items,
      target_count: targetCount,
      prize_text: prizeText,
      prize_emoji: prizeEmoji,
      deadline_time: existing.deadline_time,
      active_days: existing.active_days,
      is_team: existing.is_team,
      start_date: startDate,
      status: "active" as GoalStatus,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Archive the old goal only after the new one succeeds
  await supabase
    .from("goals")
    .update({ status: "archived" as GoalStatus })
    .eq("id", goalId);

  // Copy participants to the new goal
  const participantIds = existing.goal_participants.map(
    (p: { profile_id: string }) => p.profile_id
  );
  if (participantIds.length > 0) {
    await supabase.from("goal_participants").insert(
      participantIds.map((profileId: string) => ({
        goal_id: newGoal.id,
        profile_id: profileId,
      }))
    );
  }

  revalidatePath("/admin");
}
