import { createClient } from "@/lib/supabase/server";
import AnalyticsContent from "@/app/admin/components/AnalyticsContent";
import type { Database } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];
type CheckIn = Database["public"]["Tables"]["check_ins"]["Row"];

export type AnalyticsGoal = Goal & {
  participants: Profile[];
};

export type AnalyticsData = {
  goals: AnalyticsGoal[];
  entries: DailyEntry[];
  checkIns: CheckIn[];
};

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  // Fetch all non-archived goals with their participants
  const { data: goalData } = await supabase
    .from("goals")
    .select("*, goal_participants(profile_id, profiles(*))")
    .in("status", ["active", "completed"])
    .order("created_at", { ascending: false });

  const goals: AnalyticsGoal[] = (goalData ?? []).map((g) => {
    const participants = (
      g.goal_participants as Array<{
        profile_id: string;
        profiles: Profile;
      }>
    ).map((gp) => gp.profiles);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { goal_participants: _join, ...goalRow } = g;
    return { ...(goalRow as Goal), participants };
  });

  const goalIds = goals.map((g) => g.id);

  // Fetch all daily entries for these goals
  const { data: entries } = goalIds.length
    ? await supabase
        .from("daily_entries")
        .select("*")
        .in("goal_id", goalIds)
        .order("date", { ascending: true })
    : { data: [] };

  // Fetch all check-ins for these goals
  const { data: checkIns } = goalIds.length
    ? await supabase
        .from("check_ins")
        .select("*")
        .in("goal_id", goalIds)
        .order("date", { ascending: true })
    : { data: [] };

  return (
    <AnalyticsContent
      goals={goals}
      entries={(entries ?? []) as DailyEntry[]}
      checkIns={(checkIns ?? []) as CheckIn[]}
    />
  );
}
