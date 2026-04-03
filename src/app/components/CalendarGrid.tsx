import type { Database } from "@/types/database";
import { getDateInTimezone } from "@/lib/deadlineUtils";
import { HandDrawnNumber, HandDrawnX } from "./HandDrawnMark";

type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];

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

/* ── Build calendar grid from start date through current week ── */
function buildCalendarGrid(startDate: string, entries: DailyEntry[], timezone: string) {
  const entryMap = new Map<string, DailyEntry>();
  entries.forEach((e) => entryMap.set(e.date, e));

  // Determine "today" in the goal's timezone — works correctly regardless
  // of server timezone (UTC on Vercel, local on dev machines)
  const todayStr = getDateInTimezone(new Date(), timezone);
  const [ty, tm, td] = todayStr.split("-").map(Number);
  const today = new Date(ty, tm - 1, td);

  const [sy, sm, sd] = startDate.split("-").map(Number);
  const start = new Date(sy, sm - 1, sd);

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
      isToday: dateStr === todayStr,
      entry: entryMap.get(dateStr) ?? null,
      dayNum: current.getDate(),
    });

    current.setDate(current.getDate() + 1);
  }

  return cells;
}

interface CalendarGridProps {
  startDate: string;
  entries: DailyEntry[];
  timezone: string;
}

export default function CalendarGrid({ startDate, entries, timezone }: CalendarGridProps) {
  const cells = buildCalendarGrid(startDate, entries, timezone);

  return (
    <section className="min-w-0 bg-white rounded-2xl p-3 md:p-5 h-full">
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
        {cells.map((cell) => {
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
                backgroundColor: isSuccess && palette
                  ? palette.bg
                  : isMiss
                  ? "var(--color-miss-light)"
                  : cell.isToday
                  ? "white"
                  : cell.isWeekend
                  ? "transparent"
                  : "#F7F5F3",
                border: cell.isToday
                  ? "2.5px dashed var(--color-primary)"
                  : isSuccess || isMiss
                  ? "none"
                  : cell.isWeekend
                  ? "none"
                  : "1.5px solid #EDE8E4",
              }}
            >
              {isSuccess ? (
                <>
                  {/* Hand-drawn success number with draw-on animation */}
                  <div className="w-3/4 h-3/4 flex items-center justify-center">
                    <HandDrawnNumber
                      value={entry!.success_number!}
                      color={palette?.text ?? "#3D9B8F"}
                    />
                  </div>
                  {/* Decorations — hidden on mobile to reduce clutter */}
                  {decos.map((d, i) => (
                    <span
                      key={i}
                      className="hidden md:inline"
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
                /* Hand-drawn X with draw-on animation */
                <HandDrawnX color="#9B8EC4" />
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
  );
}
