import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HistoryContent from "@/app/admin/components/HistoryContent";
import { restartGoal } from "@/app/actions/goals";
import type { Database } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export default async function AdminHistoryPage() {
  const supabase = await createClient();

  // Fetch completed and archived goals
  const { data: goalData, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .in("status", ["completed", "archived"])
    .order("created_at", { ascending: false });

  if (goalError) {
    console.error("Failed to load goals:", goalError.message);
  }

  const goals = (goalData ?? []) as Goal[];

  // Fetch entries and participants for each goal in parallel
  const [entriesResults, participantResults] = await Promise.all([
    Promise.all(
      goals.map((g) =>
        supabase
          .from("daily_entries")
          .select("*")
          .eq("goal_id", g.id)
          .order("date", { ascending: true })
      )
    ),
    Promise.all(
      goals.map((g) =>
        supabase
          .from("goal_participants")
          .select("profiles(id, name, avatar, color)")
          .eq("goal_id", g.id)
      )
    ),
  ]);

  const goalsWithMeta = goals.map((goal, i) => {
    const entries = (entriesResults[i].data ?? []) as DailyEntry[];
    const participants = (participantResults[i].data ?? []).map(
      (p: unknown) => (p as { profiles: { id: string; name: string; avatar: string; color: string | null } }).profiles
    ).filter(Boolean) as Profile[];
    const successCount = entries.filter((e) => e.status === "success").length;
    return { ...goal, entries, participants, successCount };
  });

  async function handleRestart(goalId: string) {
    "use server";
    // Create a FormData with default restart values
    const fd = new FormData();
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;
    fd.set("target_count", String(goal.target_count));
    fd.set("prize_text", goal.prize_text);
    fd.set("prize_emoji", goal.prize_emoji ?? "");
    const d = new Date();
    fd.set("start_date", `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    fd.set("timezone", goal.timezone);
    await restartGoal(goalId, fd);
    redirect("/admin");
  }

  return <HistoryContent goals={goalsWithMeta} onRestart={handleRestart} />;
}
