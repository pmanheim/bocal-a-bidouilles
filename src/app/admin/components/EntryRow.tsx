"use client";

import { useTransition } from "react";
import type { EntryStatus } from "@/types/database";

interface EntryRowProps {
  entryId: string;
  goalId: string;
  date: string;
  status: EntryStatus;
  successNumber: number | null;
  onStatusChange: (entryId: string, goalId: string, newStatus: EntryStatus) => Promise<void>;
}

const STATUS_STYLES: Record<EntryStatus, { label: string; bg: string; text: string }> = {
  success: { label: "Success", bg: "var(--color-primary-light)", text: "var(--color-primary)" },
  miss: { label: "Missed", bg: "#FCE4EC", text: "#C62828" },
  skip: { label: "Skipped", bg: "#FFF3E0", text: "#E65100" },
  pending: { label: "Pending", bg: "#F5F5F5", text: "#9E9E9E" },
};

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.toLocaleDateString("en-US", { weekday: "short" });
  const month = date.toLocaleDateString("en-US", { month: "short" });
  return `${day}, ${month} ${d}`;
}

type ActionDef = { label: string; newStatus: EntryStatus; destructive?: boolean };

function getActions(current: EntryStatus): ActionDef[] {
  switch (current) {
    case "success":
      return [
        { label: "Mark Miss", newStatus: "miss", destructive: true },
        { label: "Skip", newStatus: "skip", destructive: true },
      ];
    case "miss":
      return [
        { label: "Mark Success", newStatus: "success" },
        { label: "Skip", newStatus: "skip" },
      ];
    case "skip":
      return [
        { label: "Mark Success", newStatus: "success" },
        { label: "Mark Miss", newStatus: "miss" },
      ];
    case "pending":
      return [
        { label: "Mark Success", newStatus: "success" },
        { label: "Mark Miss", newStatus: "miss" },
        { label: "Skip", newStatus: "skip" },
      ];
  }
}

export default function EntryRow({
  entryId,
  goalId,
  date,
  status,
  successNumber,
  onStatusChange,
}: EntryRowProps) {
  const [isPending, startTransition] = useTransition();
  const style = STATUS_STYLES[status];
  const actions = getActions(status);

  function handleAction(action: ActionDef) {
    if (action.destructive) {
      const confirmed = window.confirm(
        `Change ${formatDate(date)} from "${style.label}" to "${action.label.replace("Mark ", "")}"? This will recalculate marble numbers.`
      );
      if (!confirmed) return;
    }

    startTransition(async () => {
      await onStatusChange(entryId, goalId, action.newStatus);
    });
  }

  return (
    <div
      className="bg-surface p-4 flex items-center gap-3 flex-wrap"
      style={{ borderRadius: "var(--radius-card)", opacity: isPending ? 0.6 : 1 }}
    >
      {/* Date */}
      <span className="font-semibold text-sm min-w-[120px]">
        {formatDate(date)}
      </span>

      {/* Status badge */}
      <span
        className="px-3 py-1 text-xs font-bold rounded-full"
        style={{ backgroundColor: style.bg, color: style.text }}
      >
        {style.label}
        {status === "success" && successNumber != null && ` #${successNumber}`}
      </span>

      {/* Actions */}
      <div className="flex gap-2 ml-auto">
        {actions.map((action) => (
          <button
            key={action.newStatus}
            onClick={() => handleAction(action)}
            disabled={isPending}
            className="text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
            style={{
              color: action.destructive ? "#C62828" : "var(--color-primary)",
              backgroundColor: action.destructive ? "#FCE4EC" : "var(--color-primary-light)",
              minHeight: 36,
            }}
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
