import { createClient } from "@/lib/supabase/server";
import EntriesContent from "@/app/admin/components/EntriesContent";
import type { Database } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];

export default async function AdminEntriesPage({
  searchParams,
}: {
  searchParams: Promise<{ goal?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  // Fetch all goals (active + completed) for the goal picker
  const { data: goalData, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false });

  if (goalError) {
    console.error("Failed to load goals:", goalError.message);
  }

  const goals = (goalData ?? []) as Goal[];

  // Fetch entries for all goals in parallel
  const entriesByGoal: Record<string, DailyEntry[]> = {};

  if (goals.length > 0) {
    const results = await Promise.all(
      goals.map((g) =>
        supabase
          .from("daily_entries")
          .select("*")
          .eq("goal_id", g.id)
          .order("date", { ascending: false })
      )
    );

    for (let i = 0; i < goals.length; i++) {
      const { data, error } = results[i];
      if (error) console.error(`Failed to load entries for ${goals[i].name}:`, error.message);
      entriesByGoal[goals[i].id] = (data ?? []) as DailyEntry[];
    }
  }

  return <EntriesContent goals={goals} entriesByGoal={entriesByGoal} initialGoalId={params.goal} />;
}
