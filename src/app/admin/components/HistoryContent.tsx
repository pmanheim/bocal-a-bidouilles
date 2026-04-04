"use client";

import { useState } from "react";
import { Trophy, Calendar, Users, Eye, RotateCcw } from "lucide-react";
import type { Database, GoalStatus } from "@/types/database";
import CalendarGrid from "@/app/components/CalendarGrid";
import MarbleJar from "@/app/components/MarbleJar";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type GoalWithMeta = Goal & {
  participants: Profile[];
  entries: DailyEntry[];
  successCount: number;
};

const statusColors: Record<GoalStatus, { bg: string; text: string; label: string }> = {
  completed: { bg: "#E8F5E9", text: "#2E7D32", label: "Completed" },
  archived: { bg: "#F5F5F5", text: "#9E9E9E", label: "Archived" },
  active: { bg: "#E3F2FD", text: "#1565C0", label: "Active" },
};

interface HistoryContentProps {
  goals: GoalWithMeta[];
  onRestart: (goalId: string) => void;
}

export default function HistoryContent({ goals, onRestart }: HistoryContentProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);

  if (goals.length === 0) {
    return (
      <>
        <h2 className="text-xl font-bold mb-2">Goal History</h2>
        <p className="text-text-secondary mb-4">Completed and archived goals</p>
        <p className="text-text-secondary py-8 text-center">
          No completed or archived goals yet. Goals will appear here once they are completed or archived.
        </p>
      </>
    );
  }

  return (
    <>
      <h2 className="text-xl font-bold mb-2">Goal History</h2>
      <p className="text-text-secondary mb-6">Completed and archived goals</p>

      <div className="flex flex-col gap-4">
        {goals.map((goal) => {
          const status = statusColors[goal.status] ?? statusColors.archived;
          const isExpanded = expandedGoalId === goal.id;

          // Calculate duration
          const firstEntry = goal.entries[0];
          const lastEntry = goal.entries[goal.entries.length - 1];
          const startLabel = firstEntry
            ? formatShortDate(firstEntry.date)
            : formatShortDate(goal.start_date);
          const endLabel = lastEntry
            ? formatShortDate(lastEntry.date)
            : "—";

          return (
            <div
              key={goal.id}
              className="bg-surface flex flex-col"
              style={{ borderRadius: "var(--radius-card)" }}
            >
              {/* Summary row */}
              <div className="p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold truncate">{goal.name}</h3>
                  </div>
                  <span
                    className="shrink-0 px-3 py-1 text-xs font-bold uppercase rounded-full"
                    style={{ backgroundColor: status.bg, color: status.text }}
                  >
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-text-secondary shrink-0" />
                    <span>
                      Target: <strong>{goal.successCount}/{goal.target_count}</strong> marbles
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-text-secondary shrink-0" />
                    <span>{startLabel} – {endLabel}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{goal.prize_emoji || "🎁"}</span>
                    <span className="truncate">{goal.prize_text}</span>
                  </div>
                  {goal.participants.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-text-secondary shrink-0" />
                      <span>{goal.participants.map((p) => p.name).join(", ")}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => setExpandedGoalId(isExpanded ? null : goal.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold"
                    style={{
                      borderRadius: "var(--radius-button)",
                      minHeight: 44,
                      backgroundColor: "var(--color-primary-light)",
                      color: "var(--color-primary)",
                    }}
                  >
                    <Eye size={16} />
                    {isExpanded ? "Hide Details" : "View Details"}
                  </button>
                  <button
                    onClick={() => onRestart(goal.id)}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold"
                    style={{
                      borderRadius: "var(--radius-button)",
                      minHeight: 44,
                      backgroundColor: "#F5F5F5",
                      color: "var(--color-text-secondary)",
                    }}
                  >
                    <RotateCcw size={16} />
                    Restart
                  </button>
                </div>
              </div>

              {/* Expanded detail: calendar + jar */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-5 flex gap-6">
                  <div className="flex-[2] min-w-0">
                    <CalendarGrid
                      startDate={goal.start_date}
                      entries={goal.entries}
                      timezone={goal.timezone}
                    />
                  </div>
                  <div className="flex-[1] flex items-center justify-center" style={{ minHeight: 200 }}>
                    <MarbleJar
                      successCount={goal.successCount}
                      targetCount={goal.target_count}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

function formatShortDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
