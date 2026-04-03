"use client";

import {
  Clock,
  Users,
  User,
  Calendar,
  Trophy,
  Archive,
  RotateCcw,
  Pencil,
  SkipForward,
  FileEdit,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Database, GoalStatus } from "@/types/database";
import { skipDay } from "@/app/actions/entries";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const statusColors: Record<GoalStatus, { bg: string; text: string }> = {
  active: { bg: "var(--color-primary-light)", text: "var(--color-primary)" },
  completed: { bg: "#FFF9C4", text: "#F57F17" },
  archived: { bg: "#F5F5F5", text: "#9E9E9E" },
};

export default function GoalCard({
  goal,
  participants,
  successCount,
  onEdit,
  onArchive,
  onRestart,
}: {
  goal: Goal;
  participants: Profile[];
  successCount: number;
  onEdit: () => void;
  onArchive: () => void;
  onRestart: () => void;
}) {
  const router = useRouter();
  const activeDays = (goal.active_days as number[]) || [];
  const status = statusColors[goal.status] ?? statusColors.archived;

  return (
    <div
      className="bg-surface p-5 flex flex-col gap-4"
      style={{ borderRadius: "var(--radius-card)" }}
    >
      {/* Header row: name + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold truncate">{goal.name}</h3>
          {goal.description && (
            <p className="text-sm text-text-secondary mt-1 line-clamp-2">
              {goal.description}
            </p>
          )}
        </div>
        <span
          className="shrink-0 px-3 py-1 text-xs font-bold uppercase"
          style={{
            borderRadius: "var(--radius-button)",
            backgroundColor: status.bg,
            color: status.text,
          }}
        >
          {goal.status}
        </span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
        {/* Progress */}
        <div className="flex items-center gap-2">
          <Trophy size={16} className="text-text-secondary shrink-0" />
          <span>
            Progress:{" "}
            <strong>
              {successCount}/{goal.target_count}
            </strong>
          </span>
        </div>

        {/* Prize */}
        <div className="flex items-center gap-2">
          <span className="text-base">{goal.prize_emoji || "🎁"}</span>
          <span className="truncate">{goal.prize_text}</span>
        </div>

        {/* Deadline */}
        {goal.deadline_time && (
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-text-secondary shrink-0" />
            <span>By {goal.deadline_time.slice(0, 5)}</span>
          </div>
        )}

        {/* Team/Individual */}
        <div className="flex items-center gap-2">
          {goal.is_team ? (
            <Users size={16} className="text-text-secondary shrink-0" />
          ) : (
            <User size={16} className="text-text-secondary shrink-0" />
          )}
          <span>{goal.is_team ? "Team" : "Individual"}</span>
        </div>

        {/* Active days */}
        <div className="flex items-center gap-2 col-span-2">
          <Calendar size={16} className="text-text-secondary shrink-0" />
          <div className="flex gap-1">
            {DAY_LABELS.map((label, i) => (
              <span
                key={label}
                className="w-8 h-6 flex items-center justify-center text-xs font-semibold"
                style={{
                  borderRadius: 4,
                  backgroundColor: activeDays.includes(i)
                    ? "var(--color-primary-light)"
                    : "#F5F5F5",
                  color: activeDays.includes(i)
                    ? "var(--color-primary)"
                    : "#BDBDBD",
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Participants */}
        {participants.length > 0 && (
          <div className="flex items-center gap-2 col-span-2">
            <Users size={16} className="text-text-secondary shrink-0" />
            <span>{participants.map((p) => p.name).join(", ")}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
        {goal.status === "active" && (
          <>
            <ActionButton onClick={onEdit} icon={Pencil} label="Edit" />
            <ActionButton
              onClick={async () => {
                const today = new Date().toLocaleDateString("en-CA", { timeZone: goal.timezone });
                await skipDay(goal.id, today);
              }}
              icon={SkipForward}
              label="Skip Today"
            />
            <ActionButton
              onClick={() => router.push(`/admin/entries?goal=${goal.id}`)}
              icon={FileEdit}
              label="Correct Entry"
            />
            <ActionButton
              onClick={onArchive}
              icon={Archive}
              label="Archive"
              variant="muted"
            />
          </>
        )}
        {goal.status === "completed" && (
          <>
            <ActionButton
              onClick={onRestart}
              icon={RotateCcw}
              label="Restart"
            />
            <ActionButton
              onClick={onArchive}
              icon={Archive}
              label="Archive"
              variant="muted"
            />
          </>
        )}
      </div>
    </div>
  );
}

function ActionButton({
  onClick,
  icon: Icon,
  label,
  disabled,
  variant = "default",
}: {
  onClick: () => void;
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  disabled?: boolean;
  variant?: "default" | "muted";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition-opacity"
      style={{
        borderRadius: "var(--radius-button)",
        minHeight: 44,
        backgroundColor:
          variant === "muted" ? "#F5F5F5" : "var(--color-primary-light)",
        color:
          variant === "muted" ? "var(--color-text-secondary)" : "var(--color-primary)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}
