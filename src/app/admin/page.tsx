import { createClient } from "@/lib/supabase/server";
import GoalsContent from "./components/GoalsContent";
import type { Database } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function AdminGoalsPage() {
  const supabase = await createClient();

  // Fetch all non-archived goals with their participants
  const { data: goals } = await supabase
    .from("goals")
    .select("*, goal_participants(profile_id, profiles(*))")
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false });

  // Fetch child profiles for the participant picker
  const { data: childProfiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "child")
    .order("name");

  // Count successes per goal
  const goalIds = (goals || []).map((g) => g.id);
  const { data: successCounts } = goalIds.length
    ? await supabase
        .from("daily_entries")
        .select("goal_id")
        .in("goal_id", goalIds)
        .eq("status", "success")
    : { data: [] };

  const countMap = new Map<string, number>();
  for (const entry of successCounts || []) {
    countMap.set(entry.goal_id, (countMap.get(entry.goal_id) || 0) + 1);
  }

  // Shape data for the client component
  const goalsWithMeta = (goals || []).map((g) => {
    const participants = (
      g.goal_participants as Array<{
        profile_id: string;
        profiles: Profile;
      }>
    ).map((gp) => gp.profiles);

    // Strip the join data so we pass a clean Goal row
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { goal_participants: _join, ...goalRow } = g;

    return {
      ...(goalRow as Goal),
      participants,
      successCount: countMap.get(g.id) || 0,
    };
  });

  return (
    <GoalsContent
      goals={goalsWithMeta}
      childProfiles={(childProfiles as Profile[]) || []}
    />
  );
}
