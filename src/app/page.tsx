import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import LiveClock from "@/app/components/LiveClock";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];

interface ParticipantProfile {
  id: string;
  name: string;
  avatar: string;
  color: string | null;
}

/* ── Color palette for each success number ── */
const CELL_PALETTES = [
  { text: "#3D9B8F", bg: "#DCF5EF" }, // teal
  { text: "#5B8EC4", bg: "#DCEAF7" }, // blue
  { text: "#5BA86B", bg: "#DCF2E0" }, // green
  { text: "#D4A843", bg: "#FDE8E0" }, // gold on blush
  { text: "#5BA86B", bg: "#E5F5E8" }, // green
  { text: "#3D9B8F", bg: "#E0F5EF" }, // teal
  { text: "#D4A843", bg: "#FFF3D6" }, // gold on cream
  { text: "#D47BA0", bg: "#FCE0ED" }, // pink
  { text: "#5B9BD5", bg: "#DCEAF9" }, // sky blue
  { text: "#E08850", bg: "#FDE4D0" }, // orange
];

/* ── Decorations scattered freely across success cells ── */
const DECORATIONS = ["⭐", "❤️", "🌸", "✨", "💛", "🌟", "🦋", "🌺"];

function getDecorations(seed: number) {
  const count = 2 + (seed % 2); // 2 or 3 decorations
  const result = [];
  for (let i = 0; i < count; i++) {
    const hash = (seed * 7 + i * 13) % 100;
    const size = 22 + (hash % 10); // 22-31px — big and varied
    const rotation = ((hash * 3) % 50) - 25; // -25 to +25 degrees

    // Scatter using polar coords from center — pushes outward in random directions
    const angle = ((seed * 37 + i * 97) % 360) * (Math.PI / 180);
    const dist = 28 + (((seed * 11 + i * 17) % 100) % 18); // 28-45% from center
    const top = Math.max(0, Math.min(78, 50 + dist * Math.sin(angle)));
    const left = Math.max(0, Math.min(78, 50 + dist * Math.cos(angle)));

    result.push({
      emoji: DECORATIONS[(seed + i * 3) % DECORATIONS.length],
      top,
      left,
      size,
      rotation,
    });
  }
  return result;
}

/* ── Marble colors for jar ── */
const MARBLE_COLORS = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#A78BFA", "#FB923C",
  "#34D399", "#F472B6", "#5B9BD5", "#FF9A9E", "#C084FC",
];

/* ── Generate marble positions inside jar (viewbox 160×180, supports up to 30+) ── */
/* Jar walls: left ~36-50px, right ~110-124px depending on height.
   Marbles (r=9) must stay fully inside: cx must be ≥ wall+11, ≤ wall-11. */
function getMarblePositions(count: number) {
  const STEP_X = 16;
  const STEP_Y = 16;
  const CENTER = 80;
  const BOTTOM = 158;
  // Hex-packed rows, tapering toward the narrower neck
  const rowCapacities = [5, 4, 5, 4, 4, 4, 3, 2]; // 31 total capacity

  const positions: { cx: number; cy: number }[] = [];
  let placed = 0;

  for (let row = 0; row < rowCapacities.length && placed < count; row++) {
    const cap = rowCapacities[row];
    const toPlace = Math.min(cap, count - placed);
    const y = BOTTOM - row * STEP_Y;
    for (let col = 0; col < toPlace; col++) {
      const x = CENTER + (col - (toPlace - 1) / 2) * STEP_X;
      positions.push({ cx: x, cy: y });
    }
    placed += toPlace;
  }

  return positions;
}

/* ── Build calendar grid from start date through current week ── */
function buildCalendarGrid(startDate: string, entries: DailyEntry[]) {
  const entryMap = new Map<string, DailyEntry>();
  entries.forEach((e) => entryMap.set(e.date, e));

  const start = new Date(startDate + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find Monday of start week
  const startDow = start.getDay();
  const mondayOffset = startDow === 0 ? -6 : 1 - startDow;
  const firstMonday = new Date(start);
  firstMonday.setDate(start.getDate() + mondayOffset);

  // Find Sunday of current week
  const todayDow = today.getDay();
  const sundayOffset = todayDow === 0 ? 0 : 7 - todayDow;
  const lastSunday = new Date(today);
  lastSunday.setDate(today.getDate() + sundayOffset);

  const cells = [];
  const current = new Date(firstMonday);
  while (current <= lastSunday) {
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, "0");
    const day = String(current.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    cells.push({
      dateStr,
      dayOfWeek: current.getDay(),
      isWeekend: current.getDay() === 0 || current.getDay() === 6,
      isToday: current.getTime() === today.getTime(),
      entry: entryMap.get(dateStr) ?? null,
      dayNum: current.getDate(),
    });

    current.setDate(current.getDate() + 1);
  }

  return cells;
}

/* ── Avatar emoji lookup ── */
function getAvatarIcon(avatar: string) {
  switch (avatar) {
    case "bird": return "🐦";
    case "dog": return "🐕";
    case "cat": return "🐱";
    default: return "👤";
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const { data: goalData } = await supabase
    .from("goals")
    .select("*")
    .eq("status", "active")
    .limit(1)
    .single();

  const goal = goalData as Goal | null;

  let participants: { profiles: ParticipantProfile }[] = [];
  let entries: DailyEntry[] = [];

  if (goal) {
    const { data: participantData } = await supabase
      .from("goal_participants")
      .select("profile_id, profiles(id, name, avatar, color)")
      .eq("goal_id", goal.id);

    participants = (participantData ?? []) as unknown as {
      profiles: ParticipantProfile;
    }[];

    const { data: entryData } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("goal_id", goal.id)
      .order("date", { ascending: true });

    entries = (entryData ?? []) as DailyEntry[];
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

  const calendarCells = buildCalendarGrid(goal.start_date, entries);

  return (
    <main className="flex-1 flex flex-col min-h-screen">
      {/* ── Top Bar ── */}
      <header className="bg-primary text-white px-5 py-3 flex items-center gap-4">
        <h1 className="text-lg font-extrabold tracking-wide mr-2">
          {goal.name}
        </h1>
        {goal.prize_emoji && (
          <span className="bg-white/20 backdrop-blur px-4 py-1.5 text-sm font-bold rounded-full flex items-center gap-1.5">
            {goal.prize_emoji} {goal.prize_text}
          </span>
        )}
        <span className="bg-white/25 px-4 py-1.5 text-base font-extrabold rounded-full ml-auto">
          {successCount} / {goal.target_count}
        </span>
        {/* Mute button */}
        <button
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Toggle sound"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
          </svg>
        </button>
        {/* Settings */}
        <Link
          href="/admin"
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
          aria-label="Admin settings"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </Link>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 flex gap-6 p-5" style={{ backgroundColor: "#FAE5D8" }}>
        {/* Calendar — white card on cream background */}
        <section className="flex-[2] min-w-0 bg-white rounded-2xl p-5">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-3 mb-2 px-1">
            {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day) => (
              <div
                key={day}
                className={`text-center text-xs font-bold tracking-wider ${
                  day === "SAT" || day === "SUN"
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-3">
            {calendarCells.map((cell) => {
              const entry = cell.entry;
              const isSuccess = entry?.status === "success";
              const isMiss = entry?.status === "miss";
              const palette = isSuccess && entry?.success_number
                ? CELL_PALETTES[(entry.success_number - 1) % CELL_PALETTES.length]
                : null;
              const decos = isSuccess && entry?.decoration_seed != null
                ? getDecorations(entry.decoration_seed)
                : [];

              return (
                <div
                  key={cell.dateStr}
                  className="aspect-square rounded-2xl relative flex items-center justify-center"
                  style={{
                    backgroundColor: isSuccess
                      ? palette!.bg
                      : isMiss
                      ? "#F3E5F5"
                      : cell.isToday
                      ? "white"
                      : cell.isWeekend
                      ? "transparent"
                      : "#F7F5F3",
                    border: cell.isToday
                      ? "2.5px dashed #158068"
                      : isSuccess || isMiss
                      ? "none"
                      : cell.isWeekend
                      ? "none"
                      : "1.5px solid #EDE8E4",
                  }}
                >
                  {isSuccess ? (
                    <>
                      {/* Large success number */}
                      <span
                        className="font-extrabold leading-none"
                        style={{
                          fontSize: "clamp(52px, 8vw, 84px)",
                          color: palette!.text,
                        }}
                      >
                        {entry!.success_number}
                      </span>
                      {/* Decorations scattered freely with organic variation */}
                      {decos.map((d, i) => (
                        <span
                          key={i}
                          style={{
                            position: "absolute",
                            top: `${d.top}%`,
                            left: `${d.left}%`,
                            fontSize: `${d.size}px`,
                            lineHeight: 1,
                            transform: `rotate(${d.rotation}deg)`,
                          }}
                        >
                          {d.emoji}
                        </span>
                      ))}
                    </>
                  ) : isMiss ? (
                    /* Corner-to-corner cross-out */
                    <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <line x1="10" y1="10" x2="90" y2="90" stroke="#9B8EC4" strokeWidth="7" strokeLinecap="round" />
                      <line x1="90" y1="10" x2="10" y2="90" stroke="#9B8EC4" strokeWidth="7" strokeLinecap="round" />
                    </svg>
                  ) : cell.isToday ? (
                    <span
                      className="font-bold text-sm tracking-wide"
                      style={{ color: "#158068" }}
                    >
                      TODAY
                    </span>
                  ) : !cell.isWeekend ? (
                    <span className="text-sm text-gray-300 font-semibold">
                      {cell.dayNum}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* Right side */}
        <aside className="flex-[1] flex flex-col items-center gap-3">
          <LiveClock />

          {/* Jar with marbles — old curvy shape, fills available space */}
          {(() => {
            const marbles = getMarblePositions(successCount);
            return (
              <div className="flex-1 w-full flex items-center justify-center min-h-0">
                <svg viewBox="0 0 160 180" className="h-full w-auto" preserveAspectRatio="xMidYMax meet">
                  {/* Lid */}
                  <rect x="44" y="14" width="72" height="14" rx="4" fill="#8B9DAA" />
                  {/* Jar body — curvy neck shape */}
                  <path
                    d="M50 28 L46 48 Q40 65 38 85 L36 142 Q36 170 56 172 L104 172 Q124 170 124 142 L122 85 Q120 65 114 48 L110 28"
                    fill="rgba(200,220,235,0.12)"
                    stroke="#A8BCC8"
                    strokeWidth="2.5"
                    strokeLinejoin="round"
                  />
                  {/* Marbles */}
                  {marbles.map((pos, i) => (
                    <g key={i}>
                      <circle cx={pos.cx} cy={pos.cy} r="9" fill={MARBLE_COLORS[i % MARBLE_COLORS.length]} />
                      <circle cx={pos.cx - 3} cy={pos.cy - 3} r="2.5" fill="rgba(255,255,255,0.4)" />
                    </g>
                  ))}
                </svg>
              </div>
            );
          })()}

          {/* Participants */}
          <div className="flex gap-8 mb-3">
            {participants.map((p) => {
              const profile = p.profiles;
              if (!profile) return null;
              return (
                <div key={profile.id} className="flex flex-col items-center gap-2">
                  <div
                    className="w-28 h-28 rounded-full flex items-center justify-center text-6xl"
                    style={{
                      backgroundColor: profile.color ?? "#ccc",
                      color: "white",
                    }}
                  >
                    {getAvatarIcon(profile.avatar)}
                  </div>
                  <span className="text-lg font-bold text-text-secondary">
                    {profile.name}
                  </span>
                </div>
              );
            })}
          </div>
        </aside>
      </div>
    </main>
  );
}
