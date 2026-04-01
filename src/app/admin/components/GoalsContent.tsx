"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import GoalCard from "./GoalCard";
import GoalForm from "./GoalForm";
import { createGoal, updateGoal, archiveGoal, restartGoal } from "@/app/actions/goals";
import type { Database } from "@/types/database";

type Goal = Database["public"]["Tables"]["goals"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type GoalWithMeta = Goal & {
  participants: Profile[];
  successCount: number;
};

type FormMode =
  | { kind: "closed" }
  | { kind: "create" }
  | { kind: "edit"; goal: GoalWithMeta }
  | { kind: "restart"; goal: GoalWithMeta };

export default function GoalsContent({
  goals,
  childProfiles,
}: {
  goals: GoalWithMeta[];
  childProfiles: Profile[];
}) {
  const [formMode, setFormMode] = useState<FormMode>({ kind: "closed" });

  const activeGoals = goals.filter((g) => g.status === "active");
  const completedGoals = goals.filter((g) => g.status === "completed");

  async function handleCreate(fd: FormData) {
    await createGoal(fd);
    setFormMode({ kind: "closed" });
  }

  async function handleEdit(goalId: string, fd: FormData) {
    await updateGoal(goalId, fd);
    setFormMode({ kind: "closed" });
  }

  async function handleArchive(goalId: string) {
    try {
      await archiveGoal(goalId);
    } catch (e) {
      console.error("Failed to archive goal:", e);
    }
  }

  async function handleRestart(goalId: string, fd: FormData) {
    await restartGoal(goalId, fd);
    setFormMode({ kind: "closed" });
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Active Goals</h2>
        <button
          onClick={() => setFormMode({ kind: "create" })}
          className="flex items-center gap-2 bg-primary text-text-on-primary px-4 py-2 font-semibold"
          style={{ borderRadius: "var(--radius-button)", minHeight: 44 }}
        >
          <Plus size={18} />
          New Goal
        </button>
      </div>

      {/* Active goals */}
      {activeGoals.length === 0 && (
        <p className="text-text-secondary py-8 text-center">
          No active goals yet. Create one to get started!
        </p>
      )}
      <div className="flex flex-col gap-4">
        {activeGoals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            participants={goal.participants}
            successCount={goal.successCount}
            onEdit={() => setFormMode({ kind: "edit", goal })}
            onArchive={() => handleArchive(goal.id)}
            onRestart={() => setFormMode({ kind: "restart", goal })}
          />
        ))}
      </div>

      {/* Completed goals */}
      {completedGoals.length > 0 && (
        <>
          <h2 className="text-xl font-bold mt-10 mb-4">Completed Goals</h2>
          <div className="flex flex-col gap-4">
            {completedGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                participants={goal.participants}
                successCount={goal.successCount}
                onEdit={() => setFormMode({ kind: "edit", goal })}
                onArchive={() => handleArchive(goal.id)}
                onRestart={() => setFormMode({ kind: "restart", goal })}
              />
            ))}
          </div>
        </>
      )}

      {/* Form modal */}
      {formMode.kind === "create" && (
        <GoalForm
          mode="create"
          childProfiles={childProfiles}
          onSubmit={handleCreate}
          onCancel={() => setFormMode({ kind: "closed" })}
        />
      )}
      {formMode.kind === "edit" && (
        <GoalForm
          mode="edit"
          goal={{
            ...formMode.goal,
            participants: formMode.goal.participants.map((p) => p.id),
          }}
          childProfiles={childProfiles}
          onSubmit={(fd) => handleEdit(formMode.goal.id, fd)}
          onCancel={() => setFormMode({ kind: "closed" })}
        />
      )}
      {formMode.kind === "restart" && (
        <GoalForm
          mode="restart"
          goal={{
            ...formMode.goal,
            participants: formMode.goal.participants.map((p) => p.id),
          }}
          childProfiles={childProfiles}
          onSubmit={(fd) => handleRestart(formMode.goal.id, fd)}
          onCancel={() => setFormMode({ kind: "closed" })}
        />
      )}
    </>
  );
}
