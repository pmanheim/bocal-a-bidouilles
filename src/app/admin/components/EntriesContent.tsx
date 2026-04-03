"use client";

import { useState, useTransition } from "react";
import { CalendarOff } from "lucide-react";
import EntryRow from "./EntryRow";
import { updateEntryStatus, skipDay } from "@/app/actions/entries";
import { getDateInTimezone } from "@/lib/deadlineUtils";
import type { Database, EntryStatus } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type DailyEntry = Database["public"]["Tables"]["daily_entries"]["Row"];

interface EntriesContentProps {
  goals: Goal[];
  entriesByGoal: Record<string, DailyEntry[]>;
  initialGoalId?: string;
}

export default function EntriesContent({
  goals,
  entriesByGoal,
  initialGoalId,
}: EntriesContentProps) {
  const [selectedGoalId, setSelectedGoalId] = useState(
    initialGoalId && goals.some((g) => g.id === initialGoalId)
      ? initialGoalId
      : goals[0]?.id ?? ""
  );
  const [isSkipping, startSkipTransition] = useTransition();

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);
  const entries = entriesByGoal[selectedGoalId] ?? [];
  // Show most recent first
  const sortedEntries = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  const today = selectedGoal
    ? getDateInTimezone(new Date(), selectedGoal.timezone)
    : new Date().toISOString().split("T")[0];

  const todayEntry = entries.find((e) => e.date === today);
  const canSkipToday = !todayEntry || todayEntry.status === "pending";

  async function handleStatusChange(
    entryId: string,
    goalId: string,
    newStatus: EntryStatus
  ) {
    await updateEntryStatus(entryId, goalId, newStatus);
  }

  function handleSkipToday() {
    if (!selectedGoalId) return;
    startSkipTransition(async () => {
      await skipDay(selectedGoalId, today);
    });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <h2 className="text-xl font-bold">Edit Entries</h2>
        {canSkipToday && selectedGoal && (
          <button
            onClick={handleSkipToday}
            disabled={isSkipping}
            className="flex items-center gap-2 px-4 py-2 font-semibold text-sm disabled:opacity-50"
            style={{
              borderRadius: "var(--radius-button)",
              minHeight: 44,
              backgroundColor: "#FFF3E0",
              color: "#E65100",
            }}
          >
            <CalendarOff size={16} />
            {isSkipping ? "Skipping..." : "Skip Today"}
          </button>
        )}
      </div>

      {/* Goal picker */}
      {goals.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-semibold text-text-secondary mb-1">
            Goal
          </label>
          <select
            value={selectedGoalId}
            onChange={(e) => setSelectedGoalId(e.target.value)}
            className="w-full max-w-sm border border-gray-200 px-3 py-2 text-base"
            style={{ borderRadius: "var(--radius-card)" }}
          >
            {goals.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Subtitle */}
      {selectedGoal && (
        <p className="text-sm text-text-secondary mb-4">
          Correct daily entries or mark days as skipped for{" "}
          <strong>{selectedGoal.name}</strong>
        </p>
      )}

      {/* Entry list */}
      {sortedEntries.length === 0 ? (
        <p className="text-text-secondary py-8 text-center">
          No entries yet for this goal.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              entryId={entry.id}
              goalId={selectedGoalId}
              date={entry.date}
              status={entry.status}
              successNumber={entry.success_number}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      )}
    </>
  );
}
