import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database, ParticipantProfile } from "@/types/database";
import TopBar from "@/app/components/TopBar";
import CalendarGrid from "@/app/components/CalendarGrid";
import LiveClock from "@/app/components/LiveClock";
import MarbleJar from "@/app/components/MarbleJar";
import ParticipantAvatars from "@/app/components/ParticipantAvatars";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: goalData, error: goalError } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .single();

  if (goalError && goalError.code !== "PGRST116") {
    console.error("Failed to load goal:", goalError.message);
  }

  const goal = goalData as Goal | null;

  let participants: { profiles: ParticipantProfile }[] = [];
  let entries: DailyEntry[] = [];
  let checkedInProfileIds: string[] = [];

  if (goal) {
    const today = new Date().toISOString().split("T")[0];

    const [
      { data: participantData, error: partError },
      { data: entryData, error: entryError },
      { data: checkInData, error: checkInError },
    ] = await Promise.all([
      supabase
        .from("goal_participants")
        .select("profile_id, profiles(id, name, avatar, color)")
        .eq("goal_id", goal.id),
      supabase
        .from("daily_entries")
        .select("*")
        .eq("goal_id", goal.id)
        .order("date", { ascending: true }),
      supabase
        .from("check_ins")
        .select("profile_id")
        .eq("goal_id", goal.id)
        .eq("date", today),
    ]);

    if (partError) console.error("Failed to load participants:", partError.message);
    if (entryError) console.error("Failed to load entries:", entryError.message);
    if (checkInError) console.error("Failed to load check-ins:", checkInError.message);

    participants = (participantData ?? []) as unknown as {
      profiles: ParticipantProfile;
    }[];
    entries = (entryData ?? []) as DailyEntry[];
    checkedInProfileIds = (checkInData ?? []).map(
      (c: { profile_id: string }) => c.profile_id
    );
  }

  const successCount = entries.filter((e) => e.status === "success").length;

  if (!goal) {
    return (
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="bg-surface p-8 text-center max-w-md rounded-2xl">
          <h1 className="text-2xl font-bold mb-4">Bocal a Bidouilles</h1>
          <p className="text-text-secondary mb-6">
            No active goal found. Set up your Supabase database and run the seed
            data to get started.
          </p>
          <ol className="text-left text-sm text-text-secondary space-y-2 mb-6">
            <li>1. Add your Supabase credentials to <code>.env.local</code></li>
            <li>2. Run <code>00001_initial_schema.sql</code> in Supabase SQL Editor</li>
            <li>3. Run <code>seed.sql</code> in Supabase SQL Editor</li>
            <li>4. Restart the dev server</li>
          </ol>
          <Link href="/admin" className="text-primary underline text-sm">
            Go to Admin →
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      <TopBar
        goalName={goal.name}
        prizeEmoji={goal.prize_emoji}
        prizeText={goal.prize_text}
        successCount={successCount}
        targetCount={goal.target_count}
      />

      <div className="flex-1 flex gap-6 p-5" style={{ backgroundColor: "#FAE5D8" }}>
        <CalendarGrid startDate={goal.start_date} entries={entries} />

        <aside className="flex-[1] flex flex-col items-center gap-3">
          {goal.deadline_time && <LiveClock />}
          <MarbleJar successCount={successCount} />
          <ParticipantAvatars
            participants={participants}
            goalId={goal.id}
            initialCheckedInProfileIds={checkedInProfileIds}
          />
        </aside>
      </div>
    </main>
  );
}
