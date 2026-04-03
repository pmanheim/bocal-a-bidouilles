import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database, ParticipantProfile } from "@/types/database";
import TopBar from "@/app/components/TopBar";
import CalendarGrid from "@/app/components/CalendarGrid";
import LiveClock from "@/app/components/LiveClock";
import MarbleJar from "@/app/components/MarbleJar";
import ParticipantAvatars from "@/app/components/ParticipantAvatars";
import DashboardContent from "@/app/components/DashboardContent";
import { ensureDailyEntries } from "@/app/actions/checkIn";
import { getDateInTimezone, isAfterDeadline } from "@/lib/deadlineUtils";

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
  let isLate = false;

  if (goal) {
    // Ensure today's daily entry exists and transition past pending → miss
    await ensureDailyEntries(goal.id);

    const now = new Date();
    const today = getDateInTimezone(now, goal.timezone);

    // Determine if we're past the deadline
    isLate = isAfterDeadline(now, goal.deadline_time, goal.timezone);

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
    <main className="flex flex-col h-dvh md:min-h-screen md:h-auto overflow-hidden md:overflow-visible">
      <TopBar
        goalName={goal.name}
        prizeEmoji={goal.prize_emoji}
        prizeText={goal.prize_text}
        successCount={successCount}
        targetCount={goal.target_count}
      />

      <DashboardContent
        calendar={
          <CalendarGrid startDate={goal.start_date} entries={entries} timezone={goal.timezone} />
        }
        sidebar={
          <>
            {goal.deadline_time && <LiveClock />}
            <MarbleJar successCount={successCount} />
            <ParticipantAvatars
              participants={participants}
              goalId={goal.id}
              checklistItems={goal.checklist_items}
              initialCheckedInProfileIds={checkedInProfileIds}
              isLate={isLate}
              isTeam={goal.is_team}
              isTimed={!!goal.deadline_time}
              successCount={successCount}
              targetCount={goal.target_count}
            />
          </>
        }
      />
    </main>
  );
}
