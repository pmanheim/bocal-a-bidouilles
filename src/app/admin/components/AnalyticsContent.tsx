"use client";

import { useState, useMemo } from "react";
import type { Database } from "@/types/database";
import type { AnalyticsGoal } from "@/app/admin/analytics/page";

type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];
type CheckIn = Database["public"]["Tables"]["check_ins"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Get ISO week number for a date string (YYYY-MM-DD) */
function isoWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00Z");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/** Get year-week key like "2026-W14" */
function yearWeekKey(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const year = d.getUTCFullYear();
  return `${year}-W${String(isoWeek(dateStr)).padStart(2, "0")}`;
}

/** Get display label for a week key like "W14" */
function weekLabel(key: string): string {
  return key.split("-")[1];
}

/** Parse deadline time (HH:MM) to minutes since midnight */
function deadlineMinutes(time: string | null): number {
  if (!time) return 24 * 60;
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/** Parse checked_in_at ISO timestamp to minutes since midnight in the goal timezone */
function checkInMinutesInTimezone(
  checkedInAt: string,
  timezone: string
): number {
  const d = new Date(checkedInAt);
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: false,
    timeZone: timezone,
  }).formatToParts(d);
  const hour = parseInt(
    parts.find((p) => p.type === "hour")?.value ?? "0",
    10
  );
  const minute = parseInt(
    parts.find((p) => p.type === "minute")?.value ?? "0",
    10
  );
  return hour * 60 + minute;
}

/** Format minutes as HH:MM */
function formatMinutes(mins: number): string {
  const h = Math.floor(Math.abs(mins) / 60);
  const m = Math.round(Math.abs(mins) % 60);
  const sign = mins < 0 ? "-" : "";
  return `${sign}${h}:${String(m).padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/* Chart Components                                                   */
/* ------------------------------------------------------------------ */

type WeeklySuccessData = { week: string; successes: number; total: number }[];

function WeeklySuccessChart({ data }: { data: WeeklySuccessData }) {
  if (data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.total), 1);
  const chartW = 600;
  const chartH = 240;
  const pad = { top: 20, right: 20, bottom: 40, left: 50 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  const barGap = 4;
  const barW = Math.max(
    8,
    Math.min(40, (innerW - barGap * data.length) / data.length)
  );
  const totalBarsW = data.length * (barW + barGap) - barGap;
  const offsetX = (innerW - totalBarsW) / 2;

  // Y-axis ticks
  const yTicks = [];
  const step = Math.max(1, Math.ceil(maxVal / 5));
  for (let v = 0; v <= maxVal; v += step) yTicks.push(v);
  if (yTicks[yTicks.length - 1] < maxVal) yTicks.push(maxVal);

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH}`}
      className="w-full"
      style={{ maxWidth: chartW }}
    >
      {/* Y-axis gridlines and labels */}
      {yTicks.map((v) => {
        const y = pad.top + innerH - (v / maxVal) * innerH;
        return (
          <g key={v}>
            <line
              x1={pad.left}
              x2={chartW - pad.right}
              y1={y}
              y2={y}
              stroke="var(--color-border)"
              strokeDasharray="4 4"
            />
            <text
              x={pad.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={11}
              fill="var(--color-text-secondary)"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const x = pad.left + offsetX + i * (barW + barGap);
        const successH = (d.successes / maxVal) * innerH;
        const totalH = (d.total / maxVal) * innerH;
        return (
          <g key={d.week}>
            {/* Total bar (faded) */}
            <rect
              x={x}
              y={pad.top + innerH - totalH}
              width={barW}
              height={totalH}
              rx={3}
              fill="var(--color-border)"
              opacity={0.4}
            />
            {/* Success bar */}
            <rect
              x={x}
              y={pad.top + innerH - successH}
              width={barW}
              height={successH}
              rx={3}
              fill="var(--color-primary)"
            />
            {/* Week label */}
            <text
              x={x + barW / 2}
              y={chartH - pad.bottom + 16}
              textAnchor="middle"
              fontSize={10}
              fill="var(--color-text-secondary)"
            >
              {weekLabel(d.week)}
            </text>
          </g>
        );
      })}

      {/* Y-axis label */}
      <text
        x={14}
        y={pad.top + innerH / 2}
        textAnchor="middle"
        fontSize={11}
        fill="var(--color-text-secondary)"
        transform={`rotate(-90 14 ${pad.top + innerH / 2})`}
      >
        Entries
      </text>
    </svg>
  );
}

type TimingPoint = { week: string; avgMinutesBefore: number };
type TimingLineData = {
  profile: Profile;
  points: TimingPoint[];
};

function CheckInTimingChart({
  lines,
  allWeeks,
}: {
  lines: TimingLineData[];
  allWeeks: string[];
}) {
  if (allWeeks.length === 0 || lines.length === 0) return null;

  const chartW = 600;
  const chartH = 260;
  const pad = { top: 20, right: 20, bottom: 40, left: 60 };
  const innerW = chartW - pad.left - pad.right;
  const innerH = chartH - pad.top - pad.bottom;

  // Compute min/max across all points
  const allVals = lines.flatMap((l) => l.points.map((p) => p.avgMinutesBefore));
  if (allVals.length === 0) return null;

  const minVal = Math.min(...allVals, 0);
  const maxVal = Math.max(...allVals, 1);
  const range = maxVal - minVal || 1;

  const xScale = (week: string) => {
    const idx = allWeeks.indexOf(week);
    return pad.left + (idx / Math.max(allWeeks.length - 1, 1)) * innerW;
  };
  const yScale = (v: number) =>
    pad.top + innerH - ((v - minVal) / range) * innerH;

  // Y-axis ticks (minutes before deadline)
  const yTicks: number[] = [];
  const step = Math.max(1, Math.ceil(range / 5));
  for (let v = Math.floor(minVal / step) * step; v <= maxVal; v += step)
    yTicks.push(v);

  return (
    <svg
      viewBox={`0 0 ${chartW} ${chartH}`}
      className="w-full"
      style={{ maxWidth: chartW }}
    >
      {/* Zero line (deadline) */}
      {minVal <= 0 && maxVal >= 0 && (
        <line
          x1={pad.left}
          x2={chartW - pad.right}
          y1={yScale(0)}
          y2={yScale(0)}
          stroke="var(--color-text-secondary)"
          strokeDasharray="6 3"
          opacity={0.5}
        />
      )}

      {/* Y gridlines */}
      {yTicks.map((v) => (
        <g key={v}>
          <line
            x1={pad.left}
            x2={chartW - pad.right}
            y1={yScale(v)}
            y2={yScale(v)}
            stroke="var(--color-border)"
            strokeDasharray="4 4"
          />
          <text
            x={pad.left - 8}
            y={yScale(v) + 4}
            textAnchor="end"
            fontSize={10}
            fill="var(--color-text-secondary)"
          >
            {formatMinutes(v)}
          </text>
        </g>
      ))}

      {/* Week labels */}
      {allWeeks.map((w) => (
        <text
          key={w}
          x={xScale(w)}
          y={chartH - pad.bottom + 16}
          textAnchor="middle"
          fontSize={10}
          fill="var(--color-text-secondary)"
        >
          {weekLabel(w)}
        </text>
      ))}

      {/* Lines per kid */}
      {lines.map((line) => {
        const sortedPts = line.points
          .filter((p) => allWeeks.includes(p.week))
          .sort((a, b) => allWeeks.indexOf(a.week) - allWeeks.indexOf(b.week));
        if (sortedPts.length < 2) return null;
        const color = line.profile.color || "var(--color-primary)";
        const pathD = sortedPts
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${xScale(p.week)} ${yScale(p.avgMinutesBefore)}`
          )
          .join(" ");
        return (
          <g key={line.profile.id}>
            <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} />
            {sortedPts.map((p) => (
              <circle
                key={p.week}
                cx={xScale(p.week)}
                cy={yScale(p.avgMinutesBefore)}
                r={4}
                fill={color}
              />
            ))}
          </g>
        );
      })}

      {/* Y-axis label */}
      <text
        x={12}
        y={pad.top + innerH / 2}
        textAnchor="middle"
        fontSize={11}
        fill="var(--color-text-secondary)"
        transform={`rotate(-90 12 ${pad.top + innerH / 2})`}
      >
        Mins before deadline
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Legend                                                              */
/* ------------------------------------------------------------------ */

function ProfileLegend({ profiles }: { profiles: Profile[] }) {
  if (profiles.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-4 mt-2">
      {profiles.map((p) => (
        <div key={p.id} className="flex items-center gap-1.5 text-sm">
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: p.color || "var(--color-primary)" }}
          />
          <span style={{ color: "var(--color-text-secondary)" }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                     */
/* ------------------------------------------------------------------ */

const ALL_GOALS = "__all__";

export default function AnalyticsContent({
  goals,
  entries,
  checkIns,
}: {
  goals: AnalyticsGoal[];
  entries: DailyEntry[];
  checkIns: CheckIn[];
}) {
  const [selectedGoalId, setSelectedGoalId] = useState<string>(ALL_GOALS);

  // Filter data by selected goal
  const filteredGoals = useMemo(
    () =>
      selectedGoalId === ALL_GOALS
        ? goals
        : goals.filter((g) => g.id === selectedGoalId),
    [goals, selectedGoalId]
  );

  const filteredEntries = useMemo(
    () =>
      selectedGoalId === ALL_GOALS
        ? entries
        : entries.filter((e) => e.goal_id === selectedGoalId),
    [entries, selectedGoalId]
  );

  const filteredCheckIns = useMemo(
    () =>
      selectedGoalId === ALL_GOALS
        ? checkIns
        : checkIns.filter((c) => c.goal_id === selectedGoalId),
    [checkIns, selectedGoalId]
  );

  // All unique participants across selected goals
  const participants = useMemo(() => {
    const seen = new Map<string, Profile>();
    for (const g of filteredGoals) {
      for (const p of g.participants) {
        if (!seen.has(p.id)) seen.set(p.id, p);
      }
    }
    return Array.from(seen.values());
  }, [filteredGoals]);

  /* ---- Weekly success rate ---- */
  const weeklySuccess: WeeklySuccessData = useMemo(() => {
    const map = new Map<string, { successes: number; total: number }>();
    for (const e of filteredEntries) {
      if (e.status === "pending") continue;
      const wk = yearWeekKey(e.date);
      const cur = map.get(wk) || { successes: 0, total: 0 };
      cur.total += 1;
      if (e.status === "success") cur.successes += 1;
      map.set(wk, cur);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, d]) => ({ week, ...d }));
  }, [filteredEntries]);

  /* ---- Check-in timing trend ---- */
  const { timingLines, timingWeeks } = useMemo(() => {
    // Build a mapping from goal_id to goal for timezone / deadline lookups
    const goalMap = new Map(goals.map((g) => [g.id, g]));

    // Group check-ins by profile and week
    const byProfile = new Map<
      string,
      Map<string, number[]>
    >();

    for (const ci of filteredCheckIns) {
      const goal = goalMap.get(ci.goal_id);
      if (!goal || !goal.deadline_time) continue;

      const dlMins = deadlineMinutes(goal.deadline_time);
      const ciMins = checkInMinutesInTimezone(ci.checked_in_at, goal.timezone);
      const minutesBefore = dlMins - ciMins;

      const wk = yearWeekKey(ci.date);
      if (!byProfile.has(ci.profile_id)) byProfile.set(ci.profile_id, new Map());
      const weekMap = byProfile.get(ci.profile_id)!;
      if (!weekMap.has(wk)) weekMap.set(wk, []);
      weekMap.get(wk)!.push(minutesBefore);
    }

    const allWeeksSet = new Set<string>();
    const lines: TimingLineData[] = [];

    const profileMap = new Map(participants.map((p) => [p.id, p]));

    for (const [profileId, weekMap] of byProfile) {
      const profile = profileMap.get(profileId);
      if (!profile) continue;
      const points: TimingPoint[] = [];
      for (const [week, vals] of weekMap) {
        allWeeksSet.add(week);
        const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
        points.push({ week, avgMinutesBefore: Math.round(avg) });
      }
      lines.push({ profile, points });
    }

    const timingWeeks = Array.from(allWeeksSet).sort();
    return { timingLines: lines, timingWeeks };
  }, [filteredCheckIns, goals, participants]);

  // Determine if we have enough data
  const hasEnoughWeeks = weeklySuccess.length >= 2;

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-2xl font-bold" style={{ color: "var(--color-text-primary)" }}>
          Analytics
        </h2>

        {/* Goal picker */}
        <select
          value={selectedGoalId}
          onChange={(e) => setSelectedGoalId(e.target.value)}
          className="px-3 py-2 font-medium"
          style={{
            borderRadius: "var(--radius-button)",
            border: "1px solid var(--color-border)",
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text-primary)",
            minHeight: 44,
          }}
        >
          <option value={ALL_GOALS}>All goals</option>
          {goals.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {!hasEnoughWeeks && (
        <div
          className="text-center py-16 px-4"
          style={{
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--radius-card)",
            color: "var(--color-text-secondary)",
          }}
        >
          <p className="text-lg font-semibold mb-2">Not enough data yet</p>
          <p>
            Analytics will appear once there are at least 2 weeks of entries.
            Keep going!
          </p>
        </div>
      )}

      {/* Weekly success rate */}
      {hasEnoughWeeks && (
        <section
          className="p-4"
          style={{
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--radius-card)",
          }}
        >
          <h3
            className="text-lg font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            Weekly Success Rate
          </h3>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Successes (green) vs total entries (gray) each week
          </p>
          <WeeklySuccessChart data={weeklySuccess} />
        </section>
      )}

      {/* Check-in timing trend */}
      {hasEnoughWeeks && timingLines.length > 0 && timingWeeks.length >= 2 && (
        <section
          className="p-4"
          style={{
            backgroundColor: "var(--color-surface)",
            borderRadius: "var(--radius-card)",
          }}
        >
          <h3
            className="text-lg font-bold mb-1"
            style={{ color: "var(--color-text-primary)" }}
          >
            Check-in Timing Trend
          </h3>
          <p
            className="text-sm mb-2"
            style={{ color: "var(--color-text-secondary)" }}
          >
            Average minutes before deadline per kid, each week. Higher = earlier.
          </p>
          <ProfileLegend profiles={participants} />
          <div className="mt-3">
            <CheckInTimingChart lines={timingLines} allWeeks={timingWeeks} />
          </div>
        </section>
      )}

      {/* If we have success data but no timing data, show a note */}
      {hasEnoughWeeks &&
        (timingLines.length === 0 || timingWeeks.length < 2) && (
          <section
            className="p-4"
            style={{
              backgroundColor: "var(--color-surface)",
              borderRadius: "var(--radius-card)",
              color: "var(--color-text-secondary)",
            }}
          >
            <h3
              className="text-lg font-bold mb-1"
              style={{ color: "var(--color-text-primary)" }}
            >
              Check-in Timing Trend
            </h3>
            <p className="text-sm">
              Not enough check-in data yet. This chart will appear once kids
              have checked in across at least 2 weeks.
            </p>
          </section>
        )}
    </div>
  );
}
